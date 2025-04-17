-- First, drop the column if it exists to ensure a clean state
ALTER TABLE users DROP COLUMN IF EXISTS is_agent;

-- Then add the column with the correct configuration
ALTER TABLE users ADD COLUMN is_agent BOOLEAN NOT NULL DEFAULT FALSE; 