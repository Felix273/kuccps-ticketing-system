-- Deduplicate existing CsatResponse rows, keeping the latest rating per ticket.
-- This is required before adding a unique constraint on ticketId, since multiple
-- rows per ticket were previously allowed (caused duplicate CSAT ratings).
DELETE FROM "CsatResponse" a
USING "CsatResponse" b
WHERE a."ticketId" = b."ticketId"
  AND (
    a."createdAt" < b."createdAt"
    OR (a."createdAt" = b."createdAt" AND a.id < b.id)
  );

-- Enforce one CSAT rating per ticket going forward.
ALTER TABLE "CsatResponse" ADD CONSTRAINT "CsatResponse_ticketId_key" UNIQUE ("ticketId");
