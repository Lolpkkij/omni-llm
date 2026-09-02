import CryptoJS from "crypto-js";

const CLIENT_SALT = import.meta.env.VITE_ENCRYPTION_SALT || "default-client-salt";

export const encryptKey = (key: string) => {
  return CryptoJS.AES.encrypt(key, CLIENT_SALT).toString();
};