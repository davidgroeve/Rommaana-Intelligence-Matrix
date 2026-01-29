-- 1. Candidates Table
CREATE TABLE candidates (
    id BIGINT PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT,
    skills TEXT[],
    resume_url TEXT,
    local_filename TEXT,
    resume_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Candidate Status Table
CREATE TABLE candidate_status (
    candidate_id BIGINT PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Received',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Interviews Feedback Table
CREATE TABLE interviews_feedback (
    candidate_id BIGINT PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 0 AND rating <= 5),
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Jobs Table (Optional but recommended)
CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    title TEXT UNIQUE,
    description TEXT,
    skills TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
);
