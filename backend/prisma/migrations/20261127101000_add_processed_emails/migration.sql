-- Inbound IMAP message IDs that have been processed, so polling never creates duplicates.
CREATE TABLE IF NOT EXISTS "ProcessedEmail" (
    "messageId" TEXT NOT NULL,
    "ticketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedEmail_pkey" PRIMARY KEY ("messageId")
);

CREATE INDEX IF NOT EXISTS "ProcessedEmail_createdAt_idx" ON "ProcessedEmail"("createdAt");
