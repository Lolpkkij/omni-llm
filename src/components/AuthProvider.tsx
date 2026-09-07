import React from "react";
import { NeonAuthUIProvider } from "@neondatabase/auth/react";
import { useNavigate, Link } from "react-router-dom";
import { authClient } from "@/lib/auth-client";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

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