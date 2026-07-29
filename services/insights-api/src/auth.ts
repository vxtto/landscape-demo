import { createHash, timingSafeEqual } from "node:crypto";

function tokenDigest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function hasValidBearerToken(
  authorization: string | undefined,
  acceptedTokens: string[],
) {
  if (!authorization?.startsWith("Bearer ")) return false;
  const providedToken = authorization.slice("Bearer ".length);
  const providedDigest = tokenDigest(providedToken);

  return acceptedTokens.some((token) =>
    timingSafeEqual(providedDigest, tokenDigest(token)),
  );
}
