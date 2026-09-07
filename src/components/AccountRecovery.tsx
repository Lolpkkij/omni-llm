import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ForgotPasswordForm, ResetPasswordForm } from "@neondatabase/auth/react";
import { KeyRound, MailCheck } from "lucide-react";
import { toast } from "sonner";

type AccountRecoveryProps = {
  mode?: "forgot" | "reset";
};

const AccountRecovery = ({ mode = "forgot" }: AccountRecoveryProps) => {
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const resetUrl = `${window.location.origin}/auth/reset-password`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0b2e] p-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-800 bg-gray-900/60 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6366F1]/20 text-[#6366F1]">
            <KeyRound size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {mode === "forgot" ? "Account Recovery" : "Reset Password"}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {mode === "forgot"
              ? "We'll email you a secure link to reset your password."
              : "Choose a new password for your account."}
          </p>
        </div>

        {mode === "forgot" && sent ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
            <MailCheck className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
            <h2 className="text-lg font-bold text-white">Check your inbox</h2>
            <p className="mt-1 text-sm text-gray-400">
              If an account exists for that email, a reset link is on its way.
            </p>
          </div>
        ) : mode === "forgot" ? (
          <ForgotPasswordForm localization={{}} />
        ) : (
          <ResetPasswordForm localization={{}} />
        )}

        <p className="mt-6 text-center text-xs text-gray-500">
          Need another link?{" "}
          <a
            href="/auth/forgot-password"
            className="font-semibold text-[#6366F1] hover:text-[#818cf8]"
          >
            Request again
          </a>
        </p>
      </div>
    </div>
  );
};

export default AccountRecovery;