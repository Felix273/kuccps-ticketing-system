-- Tables referenced by knowledgeBaseController (search analytics and article feedback)
-- that exist in schema.prisma but were never created by a migration.
-- Written idempotently so databases that already have them (e.g. via `prisma db push`) are unaffected.
-- Note: the legacy nullable "KnowledgeArticle"."createdBy" column is intentionally left in place to avoid data loss.

ALTER TABLE "KnowledgeArticle" ALTER COLUMN "status" SET DEFAULT 'published';

CREATE TABLE IF NOT EXISTS "KnowledgeSearchLog" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "category" TEXT,
    "resultCount" INTEGER NOT NULL,
    "userId" TEXT,
    "userRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeSearchLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "KnowledgeFeedback" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "wasHelpful" BOOLEAN NOT NULL,
    "comment" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeFeedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "KnowledgeSearchLog_query_idx" ON "KnowledgeSearchLog"("query");
CREATE INDEX IF NOT EXISTS "KnowledgeSearchLog_resultCount_idx" ON "KnowledgeSearchLog"("resultCount");
CREATE INDEX IF NOT EXISTS "KnowledgeFeedback_articleId_idx" ON "KnowledgeFeedback"("articleId");
CREATE INDEX IF NOT EXISTS "KnowledgeArticle_isArchived_idx" ON "KnowledgeArticle"("isArchived");

-- Redundant with the unique index on "slug"
DROP INDEX IF EXISTS "KnowledgeArticle_slug_idx";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'KnowledgeFeedback_articleId_fkey') THEN
    ALTER TABLE "KnowledgeFeedback" ADD CONSTRAINT "KnowledgeFeedback_articleId_fkey"
      FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
