-- Ticket lifecycle: On Hold SLA pause, escalation stages, officer resolution record.
ALTER TABLE "Ticket"
  ADD COLUMN IF NOT EXISTS "holdReason" TEXT,
  ADD COLUMN IF NOT EXISTS "onHoldSince" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "totalHoldMinutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "slaWarningSentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "slaEscalatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "resolutionNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "resolutionEffectiveness" INTEGER,
  ADD COLUMN IF NOT EXISTS "resolutionReusable" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "resolutionRecommendations" TEXT,
  ADD COLUMN IF NOT EXISTS "knowledgeArticleId" TEXT;

-- Activity log: readable actor name and an optional note per event.
ALTER TABLE "TicketHistory"
  ADD COLUMN IF NOT EXISTS "changedByName" TEXT,
  ADD COLUMN IF NOT EXISTS "note" TEXT;

-- Lifecycle/escalation settings and email test mode.
ALTER TABLE "SystemSettings"
  ADD COLUMN IF NOT EXISTS "reopenWindowDays" INTEGER NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS "slaWarningPercent" INTEGER NOT NULL DEFAULT 75,
  ADD COLUMN IF NOT EXISTS "escalationEmails" TEXT,
  ADD COLUMN IF NOT EXISTS "emailTestMode" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "emailTestAddress" TEXT;

-- Fill in actor names for existing history rows that stored a user id.
UPDATE "TicketHistory" h SET "changedByName" = u."name"
  FROM "User" u WHERE h."changedBy" = u."id" AND h."changedByName" IS NULL;

-- Ticket categories now follow the ICT Service Charter (they drive the SLA timelines).
UPDATE "Ticket" SET "category" = CASE
    WHEN "category" IN ('Hardware Issues', 'Hardware', 'Peripheral Devices', 'Printer & Peripheral Issues') THEN 'Hardware Support'
    WHEN "category" IN ('Software Issues', 'Software') THEN 'Software Support'
    ELSE 'Incident/Problem Resolution'
  END
  WHERE "category" NOT IN ('Equipment Issuance', 'Hardware Support', 'Software Support', 'Provision of Information',
                           'Incident/Problem Resolution', 'Software Development', 'Information Inquiry');

UPDATE "SystemSettings" SET "defaultCategory" = 'Incident/Problem Resolution'
  WHERE "defaultCategory" NOT IN ('Equipment Issuance', 'Hardware Support', 'Software Support', 'Provision of Information',
                                  'Incident/Problem Resolution', 'Software Development', 'Information Inquiry');
ALTER TABLE "SystemSettings" ALTER COLUMN "defaultCategory" SET DEFAULT 'Incident/Problem Resolution';

-- Resolving a ticket now closes it immediately; close tickets left in Resolved.
UPDATE "Ticket" SET "status" = 'Closed', "closedAt" = COALESCE("closedAt", "resolvedAt", now())
  WHERE "status" = 'Resolved';
