-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'OnHold';
ALTER TYPE "TicketPriority" ADD VALUE IF NOT EXISTS 'VeryLow';
ALTER TYPE "TicketPriority" ADD VALUE IF NOT EXISTS 'VeryHigh';
