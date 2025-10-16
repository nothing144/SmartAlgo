# Public Code Submissions Setup

## Database Setup Required

To enable the Public Code Submissions feature, you need to create a new table in your Supabase database.

### Step 1: Access Supabase Dashboard

1. Go to: https://ivbvjdejhwobsijryllk.supabase.co
2. Navigate to **SQL Editor** from the left sidebar

### Step 2: Create the Table

Run the following SQL command in the SQL Editor:

```sql
-- Create public_code_submissions table
CREATE TABLE IF NOT EXISTS public_code_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  code_title TEXT NOT NULL,
  code_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_public_code_submissions_created_at 
ON public_code_submissions(created_at DESC);

-- Enable Row Level Security (optional - adjust policies as needed)
ALTER TABLE public_code_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read
CREATE POLICY "Anyone can read public code submissions"
ON public_code_submissions FOR SELECT
USING (true);

-- Create policy to allow anyone to insert
CREATE POLICY "Anyone can insert public code submissions"
ON public_code_submissions FOR INSERT
WITH CHECK (true);
```

### Step 3: Verify Table Creation

After running the SQL, verify the table exists by:
1. Going to **Table Editor** in Supabase
2. Looking for `public_code_submissions` table
3. You should see columns: `id`, `student_name`, `code_title`, `code_content`, `created_at`

### Step 4: Test the Feature

1. Visit your application
2. Click on "Public Codes" in the navigation
3. Click "Submit Your Code" button
4. Fill in the form and submit
5. Your submission should appear in the Public Code Submissions page

## Feature Overview

### What it does:
- **Anonymous Submission**: Students can submit code without logging in
- **Public Display**: All submissions are visible to everyone on a separate page
- **No Evaluation**: These submissions are NOT evaluated by AI - just saved and displayed
- **Completely Separate**: This feature is independent of the evaluated submission system

### How to use:
1. **Submit Code**: Click "Public Codes" → "Submit Your Code"
2. **View Submissions**: Click "Public Codes" → Browse all submissions
3. **Search**: Use the search bar to find specific submissions
4. **Copy Code**: Click "View Code" then "Copy to Clipboard"

### Technical Details:
- **Backend API**: `/api/public-code-submissions` (GET and POST)
- **Frontend Components**: 
  - `PublicCodeSubmit.js` - Submission form
  - `PublicCodeView.js` - View all submissions
- **Database Table**: `public_code_submissions` in Supabase
- **No Authentication Required**: Completely open for anonymous use

## Troubleshooting

If submissions are not appearing:
1. Check Supabase table was created successfully
2. Verify Row Level Security policies are set correctly
3. Check browser console for any API errors
4. Ensure `.env` file has correct Supabase credentials
