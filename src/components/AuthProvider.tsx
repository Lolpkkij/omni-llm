"use client";

import React, { useState, useEffect } from "react";
import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";
import { NeonAuthUIProvider } from "@neondatabase/auth/react";
import { useNavigate, Link } from "react-router-dom";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { toast } from "sonner";

const authClient = createAuthClient(
  `${window.location.origin}/api/auth`,
  { adapter: BetterAuthReactAdapter() }
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { setSubscription } = useSubscriptionStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isMFARequired, setIsMFARequired] = useState(false);
  const [mfaMethod, setMFAMethod] = useState<"email" | "sms" | "totp">("email");
  const [mfaCode, setMFACode] = useState("");
  const [mfaError, setMFAError] = useState("");

  // Enhanced session handling with MFA support
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await authClient.getSession();
        if (session?.data?.user) {
          // Check if MFA is required
          if (session.data.user.mfaRequired) {
            setIsMFARequired(true);
            return;
          }

          // Check subscription status
          const subscription = await fetch("/api/subscription", {
            headers: {
              Authorization: `Bearer ${session.data.user.id}`
            }
          }).then(res => res.json());

          if (subscription.active) {
            setSubscription(true, subscription.expiresAt);
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleMFAVerification = async () => {
    try {
      const result = await authClient.verifyMFA({
        code: mfaCode,
        method: mfaMethod
      });

      if (result.success) {
        setIsMFARequired(false);
        toast.success("Multi-factor authentication successful");
        // Refresh the session
        await authClient.getSession(true);
      } else {
        setMFAError(result.error || "Invalid verification code");
      }
    } catch (error) {
      setMFAError("Failed to verify code. Please try again.");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (isMFARequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md">
          <h2 className="text-2xl font-bold text-white mb-6">Multi-Factor Authentication</h2>
          <p className="text-gray-400 mb-6">Please enter the verification code sent to your {mfaMethod === "email" ? "email" : "phone"}.</p>

          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setMFAMethod("email")}
                className={`flex-1 py-2 px-4 rounded-lg border ${mfaMethod === "email" ? "border-[#6366F1] bg-[#6366F1]/10 text-[#6366F1]" : "border-gray-700 text-gray-400"}`}
              >
                Email
              </button>
              <button
                onClick={() => setMFAMethod("sms")}
                className={`flex-1 py-2 px-4 rounded-lg border ${mfaMethod === "sms" ? "border-[#6366F1] bg-[#6366F1]/10 text-[#6366F1]" : "border-gray-700 text-gray-400"}`}
              >
                SMS
              </button>
              <button
                onClick={() => setMFAMethod("totp")}
                className={`flex-1 py-2 px-4 rounded-lg border ${mfaMethod === "totp" ? "border-[#6366F1] bg-[#6366F1]/10 text-[#6366F1]" : "border-gray-700 text-gray-400"}`}
              >
                Authenticator App
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMFACode(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                placeholder="Enter the 6-digit code"
              />
            </div>

            {mfaError && (
              <p className="text-red-500 text-sm">{mfaError}</p>
            )}
          </div>

          <button
            onClick={handleMFAVerification}
            className="w-full bg-[#6366F1] hover:bg-[#4f46e5] text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Verify
          </button>
        </div>
      </div>
    );
  }

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      defaultTheme="dark"
      navigate={(href) => navigate(href)}
      replace={(href) => navigate(href, { replace: true })}
      Link={({ href, ...props }) => <Link to={href} {...props} />}
    >
      {children}
    </NeonAuthUIProvider>
  );
};

export default AuthProvider;