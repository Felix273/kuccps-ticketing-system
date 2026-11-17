CREATE TABLE "StatusSystem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    CONSTRAINT "StatusSystem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StatusIssueSystem" (
    "issueId" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    CONSTRAINT "StatusIssueSystem_pkey" PRIMARY KEY ("issueId", "systemId")
);

CREATE TABLE "KnowledgeTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    CONSTRAINT "KnowledgeTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KnowledgeArticleTag" (
    "articleId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "KnowledgeArticleTag_pkey" PRIMARY KEY ("articleId", "tagId")
);

CREATE TABLE "KnowledgeArticleRelation" (
    "articleId" TEXT NOT NULL,
    "relatedArticleId" TEXT NOT NULL,
    CONSTRAINT "KnowledgeArticleRelation_pkey" PRIMARY KEY ("articleId", "relatedArticleId")
);

CREATE TABLE "KnowledgeArticleRelatedReference" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    CONSTRAINT "KnowledgeArticleRelatedReference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SystemSettingsAllowedFileType" (
    "systemSettingsId" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    CONSTRAINT "SystemSettingsAllowedFileType_pkey" PRIMARY KEY ("systemSettingsId", "extension")
);

INSERT INTO "SystemSettingsAllowedFileType" ("systemSettingsId", "extension")
SELECT DISTINCT settings."id", lower(trim(value))
FROM "SystemSettings" AS settings
CROSS JOIN LATERAL regexp_split_to_table(COALESCE(settings."allowedFileTypes", ''), ',') AS split(value)
WHERE trim(value) <> '';

WITH expanded AS (
    SELECT trim(value) AS name, lower(trim(value)) AS normalized
    FROM "StatusIssue"
    CROSS JOIN LATERAL regexp_split_to_table(COALESCE("systems", ''), ',') AS split(value)
    WHERE trim(value) <> ''
),
canonical AS (
    SELECT normalized, min(name) AS name
    FROM expanded
    GROUP BY normalized
)
INSERT INTO "StatusSystem" ("id", "name", "normalizedName")
SELECT md5(normalized), name, normalized
FROM canonical;

INSERT INTO "StatusIssueSystem" ("issueId", "systemId")
SELECT DISTINCT issue."id", system."id"
FROM "StatusIssue" AS issue
CROSS JOIN LATERAL regexp_split_to_table(COALESCE(issue."systems", ''), ',') AS split(value)
JOIN "StatusSystem" AS system ON system."normalizedName" = lower(trim(value))
WHERE trim(value) <> '';

WITH expanded AS (
    SELECT trim(value) AS name, lower(trim(value)) AS normalized
    FROM "KnowledgeArticle"
    CROSS JOIN LATERAL regexp_split_to_table(COALESCE("tags", ''), ',') AS split(value)
    WHERE trim(value) <> ''
),
canonical AS (
    SELECT normalized, min(name) AS name
    FROM expanded
    GROUP BY normalized
)
INSERT INTO "KnowledgeTag" ("id", "name", "normalizedName")
SELECT md5(normalized), name, normalized
FROM canonical;

INSERT INTO "KnowledgeArticleTag" ("articleId", "tagId")
SELECT DISTINCT article."id", tag."id"
FROM "KnowledgeArticle" AS article
CROSS JOIN LATERAL regexp_split_to_table(COALESCE(article."tags", ''), ',') AS split(value)
JOIN "KnowledgeTag" AS tag ON tag."normalizedName" = lower(trim(value))
WHERE trim(value) <> '';

INSERT INTO "KnowledgeArticleRelation" ("articleId", "relatedArticleId")
SELECT DISTINCT article."id", target."id"
FROM "KnowledgeArticle" AS article
CROSS JOIN LATERAL regexp_split_to_table(COALESCE(article."relatedArticles", ''), ',') AS split(value)
JOIN "KnowledgeArticle" AS target
    ON target."id" = trim(value) OR target."slug" = trim(value)
WHERE trim(value) <> '' AND target."id" <> article."id";

INSERT INTO "KnowledgeArticleRelatedReference" ("id", "articleId", "reference")
SELECT DISTINCT md5(article."id" || ':' || trim(value)), article."id", trim(value)
FROM "KnowledgeArticle" AS article
CROSS JOIN LATERAL regexp_split_to_table(COALESCE(article."relatedArticles", ''), ',') AS split(value)
WHERE trim(value) <> ''
  AND NOT EXISTS (
      SELECT 1
      FROM "KnowledgeArticle" AS target
      WHERE (target."id" = trim(value) OR target."slug" = trim(value))
        AND target."id" <> article."id"
  );

CREATE UNIQUE INDEX "StatusSystem_normalizedName_key" ON "StatusSystem"("normalizedName");
CREATE INDEX "StatusIssueSystem_systemId_idx" ON "StatusIssueSystem"("systemId");
CREATE UNIQUE INDEX "KnowledgeTag_normalizedName_key" ON "KnowledgeTag"("normalizedName");
CREATE INDEX "KnowledgeArticleTag_tagId_idx" ON "KnowledgeArticleTag"("tagId");
CREATE INDEX "KnowledgeArticleRelation_relatedArticleId_idx" ON "KnowledgeArticleRelation"("relatedArticleId");
CREATE UNIQUE INDEX "KnowledgeArticleRelatedReference_articleId_reference_key" ON "KnowledgeArticleRelatedReference"("articleId", "reference");
CREATE INDEX "SystemSettingsAllowedFileType_extension_idx" ON "SystemSettingsAllowedFileType"("extension");

ALTER TABLE "StatusIssueSystem"
    ADD CONSTRAINT "StatusIssueSystem_issueId_fkey"
    FOREIGN KEY ("issueId") REFERENCES "StatusIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StatusIssueSystem"
    ADD CONSTRAINT "StatusIssueSystem_systemId_fkey"
    FOREIGN KEY ("systemId") REFERENCES "StatusSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeArticleTag"
    ADD CONSTRAINT "KnowledgeArticleTag_articleId_fkey"
    FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeArticleTag"
    ADD CONSTRAINT "KnowledgeArticleTag_tagId_fkey"
    FOREIGN KEY ("tagId") REFERENCES "KnowledgeTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeArticleRelation"
    ADD CONSTRAINT "KnowledgeArticleRelation_articleId_fkey"
    FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeArticleRelation"
    ADD CONSTRAINT "KnowledgeArticleRelation_relatedArticleId_fkey"
    FOREIGN KEY ("relatedArticleId") REFERENCES "KnowledgeArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeArticleRelatedReference"
    ADD CONSTRAINT "KnowledgeArticleRelatedReference_articleId_fkey"
    FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SystemSettingsAllowedFileType"
    ADD CONSTRAINT "SystemSettingsAllowedFileType_systemSettingsId_fkey"
    FOREIGN KEY ("systemSettingsId") REFERENCES "SystemSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StatusIssue" DROP COLUMN "systems";
ALTER TABLE "KnowledgeArticle" DROP COLUMN "tags";
ALTER TABLE "KnowledgeArticle" DROP COLUMN "relatedArticles";
ALTER TABLE "SystemSettings" DROP COLUMN "allowedFileTypes";
