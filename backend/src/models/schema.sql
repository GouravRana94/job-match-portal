DROP TABLE IF EXISTS job_matches CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS job_seekers CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) DEFAULT 'seeker',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE job_seekers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    skills TEXT[],
    experience_years DECIMAL(3,1),
    education VARCHAR(255),
    resume_text TEXT,
    preferred_location VARCHAR(255),
    current_title VARCHAR(255),
    linkedin_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    description TEXT,
    requirements TEXT[],
    location VARCHAR(255),
    salary_range VARCHAR(100),
    employment_type VARCHAR(50),
    posted_by INTEGER REFERENCES users(id),
    posted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE job_matches (
    id SERIAL PRIMARY KEY,
    job_seeker_id INTEGER REFERENCES job_seekers(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    match_score DECIMAL(5,2),
    match_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_seeker_id, job_id)
);

CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    job_seeker_id INTEGER REFERENCES job_seekers(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    UNIQUE(job_seeker_id, job_id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_jobs_title ON jobs(title);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_job_matches_score ON job_matches(match_score DESC);
CREATE INDEX idx_applications_status ON applications(status);

INSERT INTO users (email, password_hash, full_name, user_type) VALUES
('john@example.com', '$2a$10$your_hashed_password', 'John Doe', 'seeker'),
('techcorp@example.com', '$2a$10$your_hashed_password', 'TechCorp', 'employer');

INSERT INTO job_seekers (user_id, skills, experience_years, education, resume_text) VALUES
(1, ARRAY['JavaScript', 'React', 'Node.js', 'Python'], 3.5, 'BS Computer Science', 
 'Experienced full-stack developer with expertise in MERN stack and Python');

INSERT INTO jobs (title, company, description, requirements, location, posted_by) VALUES
('Senior React Developer', 'TechCorp', 
 'Looking for experienced React developer to lead frontend development',
 ARRAY['React', 'JavaScript', 'Redux', '5+ years experience'],
 'New York, NY', 2),
('Python Backend Engineer', 'DataSys',
 'Build scalable backend services with Python and Django',
 ARRAY['Python', 'Django', 'PostgreSQL', '3+ years experience'],
 'Remote', 2);