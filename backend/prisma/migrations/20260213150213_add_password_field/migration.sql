-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" TEXT;

-- Update existing users with a default password (they'll need to reset)
UPDATE "User" SET "password" = '$2b$10$defaulthashforpassword' WHERE "password" IS NULL;

-- Make password required
ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;
