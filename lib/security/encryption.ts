import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getServerConfig } from "@/lib/config";

const ALGORITHM = "aes-256-gcm";

function key() {
  return createHash("sha256").update(getServerConfig().ENCRYPTION_KEY, "utf8").digest();
}

export function encryptSecret(plainText: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptSecret(payload: string): string {
  const [version, ivEncoded, tagEncoded, encryptedEncoded] = payload.split(".");
  if (version !== "v1" || !ivEncoded || !tagEncoded || !encryptedEncoded) throw new Error("Secret chiffré invalide");
  const decipher = createDecipheriv(ALGORITHM, key(), Buffer.from(ivEncoded, "base64url"));
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedEncoded, "base64url")), decipher.final()]).toString("utf8");
}
