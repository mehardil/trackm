-- Add is_agent column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_agent'
    ) THEN
        ALTER TABLE users ADD COLUMN is_agent BOOLEAN DEFAULT FALSE;
    END IF;
END $$; 