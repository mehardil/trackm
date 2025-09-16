-- Create app_rules table
CREATE TABLE app_rules (
    id SERIAL PRIMARY KEY,
    application TEXT NOT NULL,
    category TEXT NOT NULL,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint on application name
ALTER TABLE app_rules ADD CONSTRAINT app_rules_application_unique UNIQUE (application);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_rules_updated_at
    BEFORE UPDATE ON app_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 