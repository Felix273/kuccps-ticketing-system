-- Add osTicket-inspired foundations without changing the existing ticket workflow.
ALTER TABLE "Comment" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "Comment_userId_fkey";
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Ticket" ADD COLUMN "slaDueAt" TIMESTAMP(3);
ALTER TABLE "Ticket" ADD COLUMN "slaBreached" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "SystemSettings" ADD COLUMN "darkModeEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SystemSettings" ADD COLUMN "contrastMode" TEXT NOT NULL DEFAULT 'normal';

CREATE TABLE "SavedView" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "entity" TEXT NOT NULL DEFAULT 'tickets',
  "filters" JSONB NOT NULL,
  "columns" JSONB,
  "sortBy" TEXT,
  "sortOrder" TEXT NOT NULL DEFAULT 'desc',
  "visibility" TEXT NOT NULL DEFAULT 'private',
  "role" TEXT,
  "ownerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SavedView_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KnowledgeArticle" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "excerpt" TEXT,
  "content" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "tags" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'draft',
  "views" INTEGER NOT NULL DEFAULT 0,
  "helpful" INTEGER NOT NULL DEFAULT 0,
  "notHelpful" INTEGER NOT NULL DEFAULT 0,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StatusIssue" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Investigating',
  "severity" TEXT NOT NULL DEFAULT 'Informational',
  "systems" TEXT NOT NULL DEFAULT '',
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StatusIssue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StatusIssueUpdate" (
  "id" TEXT NOT NULL,
  "issueId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StatusIssueUpdate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomForm" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomForm_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomFormField" (
  "id" TEXT NOT NULL,
  "formId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'text',
  "required" BOOLEAN NOT NULL DEFAULT false,
  "options" JSONB,
  "conditions" JSONB,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomFormField_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SlaPolicy" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "priority" TEXT,
  "category" TEXT,
  "departmentId" TEXT,
  "responseMinutes" INTEGER NOT NULL DEFAULT 240,
  "resolutionMinutes" INTEGER NOT NULL DEFAULT 1440,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SlaPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CsatResponse" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "userId" TEXT,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CsatResponse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KnowledgeArticle_slug_key" ON "KnowledgeArticle"("slug");
CREATE INDEX "SavedView_entity_idx" ON "SavedView"("entity");
CREATE INDEX "SavedView_visibility_idx" ON "SavedView"("visibility");
CREATE INDEX "SavedView_ownerId_idx" ON "SavedView"("ownerId");
CREATE INDEX "KnowledgeArticle_category_idx" ON "KnowledgeArticle"("category");
CREATE INDEX "KnowledgeArticle_status_idx" ON "KnowledgeArticle"("status");
CREATE INDEX "KnowledgeArticle_slug_idx" ON "KnowledgeArticle"("slug");
CREATE INDEX "StatusIssue_status_idx" ON "StatusIssue"("status");
CREATE INDEX "StatusIssue_severity_idx" ON "StatusIssue"("severity");
CREATE INDEX "StatusIssue_isPublic_idx" ON "StatusIssue"("isPublic");
CREATE INDEX "StatusIssueUpdate_issueId_idx" ON "StatusIssueUpdate"("issueId");
CREATE INDEX "StatusIssueUpdate_isPublic_idx" ON "StatusIssueUpdate"("isPublic");
CREATE INDEX "CustomForm_category_idx" ON "CustomForm"("category");
CREATE INDEX "CustomForm_isActive_idx" ON "CustomForm"("isActive");
CREATE INDEX "CustomFormField_formId_idx" ON "CustomFormField"("formId");
CREATE INDEX "CustomFormField_key_idx" ON "CustomFormField"("key");
CREATE INDEX "SlaPolicy_priority_idx" ON "SlaPolicy"("priority");
CREATE INDEX "SlaPolicy_category_idx" ON "SlaPolicy"("category");
CREATE INDEX "SlaPolicy_departmentId_idx" ON "SlaPolicy"("departmentId");
CREATE INDEX "SlaPolicy_isActive_idx" ON "SlaPolicy"("isActive");
CREATE INDEX "CsatResponse_ticketId_idx" ON "CsatResponse"("ticketId");
CREATE INDEX "CsatResponse_rating_idx" ON "CsatResponse"("rating");

ALTER TABLE "SavedView" ADD CONSTRAINT "SavedView_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StatusIssueUpdate" ADD CONSTRAINT "StatusIssueUpdate_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "StatusIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomFormField" ADD CONSTRAINT "CustomFormField_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CustomForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SlaPolicy" ADD CONSTRAINT "SlaPolicy_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CsatResponse" ADD CONSTRAINT "CsatResponse_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CsatResponse" ADD CONSTRAINT "CsatResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
