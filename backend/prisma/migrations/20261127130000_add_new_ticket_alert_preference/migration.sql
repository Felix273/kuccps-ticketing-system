-- Officers can choose to be emailed when a new ticket arrives in the queue.
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "emailOnNewTicket" BOOLEAN NOT NULL DEFAULT true;
