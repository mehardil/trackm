-- Create restrictions table
CREATE TABLE IF NOT EXISTS restrictions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  pattern VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('block', 'warn')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_restrictions_type_pattern ON restrictions(type, pattern);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_restrictions_updated_at
  BEFORE UPDATE ON restrictions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 