import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

let secret: Buffer | null = null;

function getSecret() {
    if (secret) return secret;

    const hex = process.env.PUSHWARD_ENCRYPTION_KEY;
    if (!hex) {
        throw new Error("PUSHWARD_ENCRYPTION_KEY is not set");
    }

    const key = Buffer.from(hex, "hex");
    if (key.length !== 32) {
        throw new Error("PUSHWARD_ENCRYPTION_KEY must be 32 bytes (64 hex chars) for aes-256-gcm");
    }

    secret = key;
    return secret;
}

export function encrypt(text: string) {
    const iv = randomBytes(12); // random starting value
    const cipher = createCipheriv("aes-256-gcm", getSecret(), iv);
    const data = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag(); // to detect if the stored value was altered
    return [iv, tag, data].map((b) => b.toString("base64")).join(".");
}

export function decrypt(stored: string) {
    const [iv, tag, data] = stored.split(".").map((s) => Buffer.from(s, "base64"));
    const decipher = createDecipheriv("aes-256-gcm", getSecret(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}