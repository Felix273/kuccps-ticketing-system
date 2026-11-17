-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'staff', 'admin');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('Open', 'InProgress', 'Resolved', 'Closed');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- CreateEnum
CREATE TYPE "StatusIssueStatus" AS ENUM ('Investigating', 'Identified', 'Monitoring', 'Resolved');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('Informational', 'Warning', 'Error');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('private', 'shared', 'global');

-- DropIndex
DROP INDEX "Ticket_responseDueAt_idx";

-- DropIndex
DROP INDEX "Ticket_slaEscalationAt_idx";

-- AlterTable
ALTER TABLE "SavedView" DROP COLUMN "visibility",
ADD COLUMN     "visibility" "Visibility" NOT NULL DEFAULT 'private';

-- AlterTable
ALTER TABLE "StatusIssue" DROP COLUMN "status",
ADD COLUMN     "status" "StatusIssueStatus" NOT NULL DEFAULT 'Investigating',
DROP COLUMN "severity",
ADD COLUMN     "severity" "Severity" NOT NULL DEFAULT 'Informational';

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "priority",
ADD COLUMN     "priority" "TicketPriority" NOT NULL DEFAULT 'Medium',
DROP COLUMN "status",
ADD COLUMN     "status" "TicketStatus" NOT NULL DEFAULT 'Open';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'staff';

-- CreateIndex
CREATE INDEX "SavedView_visibility_idx" ON "SavedView"("visibility");

-- CreateIndex
CREATE INDEX "StatusIssue_status_idx" ON "StatusIssue"("status");

-- CreateIndex
CREATE INDEX "StatusIssue_severity_idx" ON "StatusIssue"("severity");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_priority_idx" ON "Ticket"("priority");

