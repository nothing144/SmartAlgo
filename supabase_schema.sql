-- Supabase Migration Schema for Rubrics Evaluator
-- This file contains the SQL schema to create tables in Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rubrics table
CREATE TABLE public.rubrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL,
    submission_type VARCHAR(50) DEFAULT 'any' CHECK (submission_type IN ('flowchart', 'algorithm', 'pseudocode', 'any')),
    created_by VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table  
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) DEFAULT 'anonymous',
    student_name VARCHAR(255) NOT NULL,
    assignment_title VARCHAR(255) NOT NULL,
    submission_type VARCHAR(50) NOT NULL CHECK (submission_type IN ('flowchart', 'algorithm', 'pseudocode')),
    text_content TEXT,
    image_url TEXT,
    cloudinary_data JSONB,
    file_name VARCHAR(255),
    rubric_id UUID REFERENCES public.rubrics(id),
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'evaluating', 'completed', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create evaluations table
CREATE TABLE public.evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
    ai_analysis JSONB NOT NULL,
    rubric_scores JSONB NOT NULL,
    total_score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);
CREATE INDEX idx_submissions_created_at ON public.submissions(created_at);
CREATE INDEX idx_evaluations_submission_id ON public.evaluations(submission_id);
CREATE INDEX idx_rubrics_active ON public.rubrics(is_active);

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (basic policies - can be customized)
-- Allow all operations for now (you can restrict these later)
CREATE POLICY "Allow all for submissions" ON public.submissions FOR ALL USING (true);
CREATE POLICY "Allow all for evaluations" ON public.evaluations FOR ALL USING (true);
CREATE POLICY "Allow all for rubrics" ON public.rubrics FOR ALL USING (true);
CREATE POLICY "Allow all for users" ON public.users FOR ALL USING (true);

-- Insert a default rubric for testing
INSERT INTO public.rubrics (title, description, criteria, submission_type, created_by) VALUES (
    'Default Evaluation Rubric',
    'Standard rubric for evaluating algorithms, pseudocode, and flowcharts',
    '[
        {
            "criterion_id": "logic_correctness_001",
            "name": "Logic Correctness",
            "description": "Accuracy of the logical flow and problem-solving approach",
            "max_points": 5,
            "levels": [
                {"points": 5, "description": "Completely correct logic with optimal approach"},
                {"points": 4, "description": "Mostly correct with minor logical issues"},
                {"points": 3, "description": "Partially correct with some logical flaws"},
                {"points": 2, "description": "Major logical issues but shows understanding"},
                {"points": 1, "description": "Significant logical errors"},
                {"points": 0, "description": "No logical structure or completely incorrect"}
            ]
        },
        {
            "criterion_id": "structure_organization_001",
            "name": "Structure & Organization", 
            "description": "Clear structure, proper flow, and organization of elements",
            "max_points": 3,
            "levels": [
                {"points": 3, "description": "Well-organized with clear structure"},
                {"points": 2, "description": "Generally organized with minor issues"},
                {"points": 1, "description": "Some organization but lacks clarity"},
                {"points": 0, "description": "Poor organization and unclear structure"}
            ]
        },
        {
            "criterion_id": "syntax_clarity_001",
            "name": "Syntax & Clarity",
            "description": "Proper syntax, clear notation, and readability", 
            "max_points": 2,
            "levels": [
                {"points": 2, "description": "Perfect syntax and very clear"},
                {"points": 1, "description": "Minor syntax issues but mostly clear"},
                {"points": 0, "description": "Major syntax errors or unclear notation"}
            ]
        }
    ]'::jsonb,
    'any',
    'system'
);