import jwt from "jsonwebtoken";
import { securityLogger } from "./securityLogger";

// JWT configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || "default-jwt-secret-change-in-production",
  expiresIn: "1h",
  algorithm: "HS256" as jwt.Algorithm,
  issuer: "omni-llm",
  audience: "omni-llm-api"
};

// Generate a JWT token
export const generateToken = (payload: any): string => {
  try {
    const token = jwt.sign(payload, JWT_CONFIG.secret, {
      expiresIn: JWT_CONFIG.expiresIn,
      algorithm: JWT_CONFIG.algorithm,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    });

    securityLogger.info("JWT token generated", {
      payload: { ...payload, password: "[REDACTED]" },
      expiresIn: JWT_CONFIG.expiresIn
    });

    return token;
  } catch (error) {
    securityLogger.error("Failed to generate JWT token", { error });
    throw new Error("Failed to generate token");
  }
};

// Verify a JWT token
export const verifyToken = (token: string): any => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secret, {
      algorithms: [JWT_CONFIG.algorithm],
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    });

    securityLogger.info("JWT token verified", { decoded });

    return decoded;
  } catch (error) {
    securityLogger.warning("Failed to verify JWT token", { error, token });
    throw new Error("Invalid or expired token");
  }
};

// Decode a JWT token without verification
export const decodeToken = (token: string): any => {
  try {
    const decoded = jwt.decode(token);
    securityLogger.info("JWT token decoded", { decoded });
    return decoded;
  } catch (error) {
    securityLogger.warning("Failed to decode JWT token", { error, token });
    throw new Error("Invalid token");
  }
};