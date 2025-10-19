// middlewares/dataCrypto.js
import { createDecipheriv, createHash } from "node:crypto";

function deriveKeyIv() {
  const key = createHash("sha256")
    .update(String(process.env.AES_SECRET_KEY || "plastifay-default-key"))
    .digest(); // 32B
  const iv = createHash("sha1")
    .update(String(process.env.AES_IV || "plastifay-default-iv"))
    .digest()
    .subarray(0, 16); // 16B
  return { key, iv };
}

export function decryptFromServerBase64(b64) {
  const { key, iv } = deriveKeyIv();
  try {
    const buf = Buffer.from(Buffer.isBuffer(b64) ? b64.toString("utf8") : String(b64), "base64");
    const decipher = createDecipheriv("aes-256-cbc", key, iv);
    const out = Buffer.concat([decipher.update(buf), decipher.final()]);
    return out.toString("utf8");
  } catch {
    return Buffer.isBuffer(b64) ? b64.toString("utf8") : String(b64);
  }
}
