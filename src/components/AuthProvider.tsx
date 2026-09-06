"use client";

import React, { useState, useEffect } from "react";
import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";
import { NeonAuthUIProvider } from "@neondatabase/auth/react";
import { useNavigate } from "react-router-dom";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";

const authClient = createAuthClient(
  `${window.location.origin}/api/auth`,
  { adapter: BetterAuthReactAdapter() }
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { setSubscription } = useSubscriptionStore();
  const [isLoading, setIsLoading] = useState(true);

  // Enhanced session handling with error recovery
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await authClient.getSession();
        if (session?.data?.user) {
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
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