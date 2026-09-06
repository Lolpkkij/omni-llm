import CryptoJS from "crypto-js";

// Use a stronger encryption algorithm (AES-256-GCM)
const ENCRYPTION_ALGORITHM = "AES-256-GCM";

// Generate a secure random salt for each encryption operation
export const generateSalt = () => {
  return CryptoJS.lib.WordArray.random(32).toString();
};

// Encrypt data with additional security parameters
export const encryptData = (data: string, salt: string) => {
  const iv = CryptoJS.lib.WordArray.random(16); // Generate a random IV
  const encrypted = CryptoJS.AES.encrypt(data, salt, {
    iv: iv,
    mode: CryptoJS.mode.GCM,
    padding: CryptoJS.pad.Pkcs7
  });

  // Return the IV, salt, and ciphertext together
  return {
    iv: iv.toString(),
    salt: salt,
    ciphertext: encrypted.toString()
  };
};

// Decrypt data with the provided parameters
export const decryptData = (encryptedData: { iv: string; salt: string; ciphertext: string }) => {
  const { iv, salt, ciphertext } = encryptedData;
  const decrypted = CryptoJS.AES.decrypt(ciphertext, salt, {
    iv: CryptoJS.enc.Hex.parse(iv),
    mode: CryptoJS.mode.GCM,
    padding: CryptoJS.pad.Pkcs7
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
};

// Generate a secure random key for API key rotation
export const generateApiKey = () => {
  return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
};