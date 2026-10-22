import { createHash } from "crypto";

export function getSessionOwnerId(token: string | undefined): string | null {
  if (!token) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
    );
    if (typeof payload?.sub !== "string") return null;
    return createHash("sha256").update(payload.sub).digest("hex").slice(0, 16);
  } catch {
    return null;
  }
}
