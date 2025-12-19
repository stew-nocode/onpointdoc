-- Migration: Add file_name column to ticket_attachments table
-- Date: 2025-01-31
-- Purpose: Allow displaying user-friendly file names for ticket attachments

-- Add file_name column (nullable initially to allow backfill)
ALTER TABLE public.ticket_attachments
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Backfill existing records by extracting filename from file_path
-- Format: {ticketId}/{timestamp}-{filename}
-- Example: "abc-123/1234567890-document.pdf" -> "document.pdf"
UPDATE public.ticket_attachments
SET file_name = SUBSTRING(file_path FROM '(?:[^/]+/)?[0-9]+-(.+)$')
WHERE file_name IS NULL;

-- Make file_name NOT NULL after backfilling
ALTER TABLE public.ticket_attachments
ALTER COLUMN file_name SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.ticket_attachments.file_name IS 'Original filename of the uploaded file';
