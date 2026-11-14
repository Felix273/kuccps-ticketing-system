ALTER TABLE "KnowledgeArticle"
ADD COLUMN IF NOT EXISTS "symptoms" TEXT,
ADD COLUMN IF NOT EXISTS "affectedDevices" TEXT,
ADD COLUMN IF NOT EXISTS "cause" TEXT,
ADD COLUMN IF NOT EXISTS "resolution" TEXT,
ADD COLUMN IF NOT EXISTS "escalation" TEXT,
ADD COLUMN IF NOT EXISTS "relatedArticles" TEXT,
ADD COLUMN IF NOT EXISTS "attachments" JSONB,
ADD COLUMN IF NOT EXISTS "authorId" TEXT,
ADD COLUMN IF NOT EXISTS "authorName" TEXT,
ADD COLUMN IF NOT EXISTS "authorRole" TEXT DEFAULT 'staff',
ADD COLUMN IF NOT EXISTS "approvedBy" TEXT,
ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "KnowledgeRevision" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "symptoms" TEXT,
    "resolution" TEXT,
    "changedBy" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KnowledgeRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "KnowledgeRevision_articleId_idx"
ON "KnowledgeRevision"("articleId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'KnowledgeRevision_articleId_fkey'
    ) THEN
        ALTER TABLE "KnowledgeRevision"
        ADD CONSTRAINT "KnowledgeRevision_articleId_fkey"
        FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
