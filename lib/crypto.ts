import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const SECRET = Buffer.from(process.env.PUSHWARD_ENCRYPTION_KEY!, "hex");

export function encrypt(text: string) {
    const iv = randomBytes(12); // random starting value
    const cipher = createCipheriv("aes-256-gcm", SECRET, iv);
    const data = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag(); // to detect if the stored value was altered
    return [iv, tag, data].map((b) => b.toString("base64")).join(".");
}

export function decrypt(stored: string) {
    const [iv, tag, data] = stored.split(".").map((s) => Buffer.from(s, "base64"));
    const decipher = createDecipheriv("aes-256-gcm", SECRET, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}