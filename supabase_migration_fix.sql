-- Migration to fix missing combined_submission_id column
-- Run this SQL in your Supabase SQL Editor

-- Add the missing combined_submission_id column to submissions table
ALTER TABLE public.submissions 
ADD COLUMN combined_submission_id UUID NULL;

-- Add index for better performance when querying combined submissions
CREATE INDEX idx_submissions_combined_id ON public.submissions(combined_submission_id);

-- Add comment for documentation
COMMENT ON COLUMN public.submissions.combined_submission_id IS 'Links multiple submissions together when user submits all three types (algorithm + pseudocode + flowchart) at once';

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'submissions' 
  AND table_schema = 'public' 
  AND column_name = 'combined_submission_id';