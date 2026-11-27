-- Server-side session revocation: JWTs issued before this timestamp are rejected.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokensRevokedAt" TIMESTAMP(3);
