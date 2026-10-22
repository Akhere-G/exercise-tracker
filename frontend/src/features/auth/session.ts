import { createHash } from "crypto";

// A stable, non-reversible id for the signed-in user, taken from the session
// token's subject. It is only used to keep per-user data in the browser apart
// (see WorkoutOwnerGuard), never for authorisation, so the token is decoded
// without verifying its signature; the API does that on every request.
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
