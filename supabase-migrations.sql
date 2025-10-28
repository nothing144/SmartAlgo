-- ===========================================================================
-- SUPABASE DATABASE MIGRATIONS FOR PUBLIC OUTPUT PHOTOS FEATURE
-- ===========================================================================
-- Run these SQL commands in your Supabase SQL Editor to add support for:
-- 1. Public Output Photos (standalone output photo submissions)
-- 2. Optional output photos for Public Code Submissions
-- ===========================================================================

-- Step 1: Add optional output photo fields to existing public_code_submissions table
-- ---------------------------------------------------------------------------
ALTER TABLE public_code_submissions 
ADD COLUMN IF NOT EXISTS output_photo_url TEXT,
ADD COLUMN IF NOT EXISTS output_photo_cloudinary_data JSONB;

-- Add comment to document the new columns
COMMENT ON COLUMN public_code_submissions.output_photo_url IS 'Optional URL to output screenshot stored in Cloudinary';
COMMENT ON COLUMN public_code_submissions.output_photo_cloudinary_data IS 'Optional Cloudinary metadata for output photo';


-- Step 2: Create new public_output_photos table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public_output_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  output_title TEXT NOT NULL,
  output_photo_url TEXT NOT NULL,
  output_photo_cloudinary_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_public_output_photos_created_at ON public_output_photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_output_photos_student_name ON public_output_photos(student_name);

-- Add comments to document the table
COMMENT ON TABLE public_output_photos IS 'Stores public output photo submissions (no authentication required)';
COMMENT ON COLUMN public_output_photos.id IS 'Unique identifier for the output photo submission';
COMMENT ON COLUMN public_output_photos.student_name IS 'Name of the student who submitted the output';
COMMENT ON COLUMN public_output_photos.output_title IS 'Title/description of the program output';
COMMENT ON COLUMN public_output_photos.output_photo_url IS 'Cloudinary URL for the output screenshot';
COMMENT ON COLUMN public_output_photos.output_photo_cloudinary_data IS 'Cloudinary metadata (public_id, format, dimensions, etc.)';
COMMENT ON COLUMN public_output_photos.created_at IS 'Timestamp when the output was submitted';

-- Enable Row Level Security (RLS) - Allow public read access
ALTER TABLE public_output_photos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read
CREATE POLICY "Allow public read access" ON public_output_photos
  FOR SELECT USING (true);

-- Create policy to allow anyone to insert (for anonymous submissions)
CREATE POLICY "Allow public insert" ON public_output_photos
  FOR INSERT WITH CHECK (true);

-- ===========================================================================
-- MIGRATION COMPLETE
-- ===========================================================================
-- After running these commands:
-- 1. Verify both tables exist in your Supabase Tables view
-- 2. Check that public_code_submissions has the new optional columns
-- 3. Check that public_output_photos table is created with proper indexes
-- 4. Test the API endpoints to ensure everything works
-- ===========================================================================
