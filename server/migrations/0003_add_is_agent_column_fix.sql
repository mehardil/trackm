-- Drop the column if it exists
ALTER TABLE users DROP COLUMN IF EXISTS is_agent;

-- Add the column with proper constraints
ALTER TABLE users ADD COLUMN is_agent BOOLEAN NOT NULL DEFAULT FALSE; 