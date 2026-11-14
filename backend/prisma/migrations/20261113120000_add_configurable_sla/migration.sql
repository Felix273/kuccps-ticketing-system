ALTER TABLE "Ticket"
ADD COLUMN "firstRespondedAt" TIMESTAMP(3),
ADD COLUMN "responseDueAt" TIMESTAMP(3),
ADD COLUMN "slaEscalationAt" TIMESTAMP(3);

CREATE INDEX "Ticket_responseDueAt_idx" ON "Ticket"("responseDueAt");
CREATE INDEX "Ticket_slaEscalationAt_idx" ON "Ticket"("slaEscalationAt");

ALTER TABLE "SlaPolicy"
ADD COLUMN "policyKey" TEXT,
ADD COLUMN "responseValue" DOUBLE PRECISION,
ADD COLUMN "responseUnit" TEXT,
ADD COLUMN "responseTargetPercent" INTEGER,
ADD COLUMN "resolutionValue" DOUBLE PRECISION,
ADD COLUMN "resolutionUnit" TEXT,
ADD COLUMN "resolutionTargetPercent" INTEGER,
ADD COLUMN "escalationGraceHours" INTEGER,
ADD COLUMN "defaultResponseValue" DOUBLE PRECISION,
ADD COLUMN "defaultResponseUnit" TEXT,
ADD COLUMN "defaultResponseTargetPercent" INTEGER,
ADD COLUMN "defaultResolutionValue" DOUBLE PRECISION,
ADD COLUMN "defaultResolutionUnit" TEXT,
ADD COLUMN "defaultResolutionTargetPercent" INTEGER,
ADD COLUMN "defaultEscalationGraceHours" INTEGER,
ADD COLUMN "isSlaDefault" BOOLEAN NOT NULL DEFAULT false;

UPDATE "SlaPolicy"
SET "policyKey" = 'legacy:' || "id"
WHERE "policyKey" IS NULL;

ALTER TABLE "SlaPolicy"
ALTER COLUMN "policyKey" SET NOT NULL;

CREATE UNIQUE INDEX "SlaPolicy_policyKey_key" ON "SlaPolicy"("policyKey");
CREATE INDEX "SlaPolicy_isSlaDefault_idx" ON "SlaPolicy"("isSlaDefault");

CREATE TABLE "SlaPolicyAudit" (
    "id" TEXT NOT NULL,
    "policyKey" TEXT NOT NULL,
    "changedById" TEXT,
    "changedByName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlaPolicyAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SlaPolicyAudit_policyKey_createdAt_idx" ON "SlaPolicyAudit"("policyKey", "createdAt");

ALTER TABLE "SlaPolicyAudit"
ADD CONSTRAINT "SlaPolicyAudit_policyKey_fkey"
FOREIGN KEY ("policyKey") REFERENCES "SlaPolicy"("policyKey") ON DELETE CASCADE ON UPDATE CASCADE;
