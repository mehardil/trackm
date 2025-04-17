-- Create database
CREATE DATABASE trackm;

-- Connect to the database
\c trackm;

-- Create tables
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}',
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    department TEXT,
    role TEXT DEFAULT 'user',
    avatar_color TEXT,
    status TEXT DEFAULT 'offline',
    last_active TIMESTAMP,
    team_id INTEGER,
    organization_id INTEGER
);

CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id INTEGER NOT NULL,
    organization_id INTEGER
);

CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    team_id INTEGER,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL,
    application TEXT NOT NULL,
    website TEXT,
    title TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE screenshots (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    team_id INTEGER,
    timestamp TIMESTAMP NOT NULL,
    image_data TEXT NOT NULL,
    application TEXT,
    website TEXT,
    title TEXT
);

CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    team_id INTEGER,
    timestamp TIMESTAMP NOT NULL,
    application TEXT NOT NULL,
    website TEXT,
    title TEXT,
    message TEXT NOT NULL,
    action_taken TEXT NOT NULL
);

CREATE TABLE agent_status (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    team_id INTEGER,
    timestamp TIMESTAMP NOT NULL,
    version TEXT NOT NULL,
    platform TEXT NOT NULL,
    is_running BOOLEAN NOT NULL,
    is_connected BOOLEAN NOT NULL,
    last_activity_time TIMESTAMP NOT NULL,
    cpu_usage REAL,
    memory_usage REAL,
    disk_space REAL
);

CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL
);

CREATE TABLE websites (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL
);

CREATE TABLE restricted_apps (
    id SERIAL PRIMARY KEY,
    team_id INTEGER,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    alert_threshold INTEGER NOT NULL,
    close_after_alert BOOLEAN DEFAULT FALSE,
    alert_message TEXT,
    process_names JSONB NOT NULL
);

CREATE TABLE agent_config (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    team_id INTEGER,
    screenshot_frequency INTEGER DEFAULT 5,
    activity_tracking_interval INTEGER DEFAULT 5,
    idle_threshold INTEGER DEFAULT 60,
    monitor_applications BOOLEAN DEFAULT TRUE,
    monitor_websites BOOLEAN DEFAULT TRUE,
    capture_screenshots BOOLEAN DEFAULT TRUE,
    capture_quality TEXT DEFAULT 'medium',
    privacy_protection BOOLEAN DEFAULT TRUE,
    data_retention_days INTEGER DEFAULT 90,
    mask_screenshots_in_private_apps BOOLEAN DEFAULT TRUE,
    private_mode BOOLEAN DEFAULT FALSE,
    enforce_restricted_apps BOOLEAN DEFAULT TRUE,
    detect_anomalies BOOLEAN DEFAULT TRUE,
    track_usb_devices BOOLEAN DEFAULT TRUE,
    allow_offline_collection BOOLEAN DEFAULT TRUE,
    sync_interval_minutes INTEGER DEFAULT 15,
    working_hours_enabled BOOLEAN DEFAULT FALSE,
    working_hours_start TEXT DEFAULT '09:00',
    working_hours_end TEXT DEFAULT '17:00',
    working_days JSONB DEFAULT '[1,2,3,4,5]',
    custom_categories JSONB DEFAULT '[]'
);

CREATE TABLE daily_summaries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    team_id INTEGER,
    date TIMESTAMP NOT NULL,
    active_time INTEGER NOT NULL,
    productive_time INTEGER NOT NULL,
    neutral_time INTEGER NOT NULL,
    unproductive_time INTEGER NOT NULL,
    productivity_score REAL NOT NULL,
    top_applications JSONB,
    top_websites JSONB,
    start_time TIMESTAMP,
    end_time TIMESTAMP
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT
);

-- Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT fk_users_team FOREIGN KEY (team_id) REFERENCES teams(id);
ALTER TABLE users ADD CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE teams ADD CONSTRAINT fk_teams_organization FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE activities ADD CONSTRAINT fk_activities_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE activities ADD CONSTRAINT fk_activities_team FOREIGN KEY (team_id) REFERENCES teams(id);
ALTER TABLE screenshots ADD CONSTRAINT fk_screenshots_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE screenshots ADD CONSTRAINT fk_screenshots_team FOREIGN KEY (team_id) REFERENCES teams(id);
ALTER TABLE alerts ADD CONSTRAINT fk_alerts_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE alerts ADD CONSTRAINT fk_alerts_team FOREIGN KEY (team_id) REFERENCES teams(id);
ALTER TABLE agent_status ADD CONSTRAINT fk_agent_status_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE agent_status ADD CONSTRAINT fk_agent_status_team FOREIGN KEY (team_id) REFERENCES teams(id);
ALTER TABLE restricted_apps ADD CONSTRAINT fk_restricted_apps_team FOREIGN KEY (team_id) REFERENCES teams(id);
ALTER TABLE agent_config ADD CONSTRAINT fk_agent_config_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE agent_config ADD CONSTRAINT fk_agent_config_team FOREIGN KEY (team_id) REFERENCES teams(id);
ALTER TABLE daily_summaries ADD CONSTRAINT fk_daily_summaries_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE daily_summaries ADD CONSTRAINT fk_daily_summaries_team FOREIGN KEY (team_id) REFERENCES teams(id);
ALTER TABLE projects ADD CONSTRAINT fk_projects_team FOREIGN KEY (team_id) REFERENCES teams(id);

-- Insert initial data
-- Create default organization
INSERT INTO organizations (id, name, description) VALUES (1, 'Default Organization', 'Default organization for testing');

-- Create default user
INSERT INTO users (id, username, password, name, email, role) VALUES (1, 'admin', 'admin123', 'Admin User', 'admin@example.com', 'admin');

-- Create default team with the admin user as owner
INSERT INTO teams (id, name, description, owner_id) VALUES (1, 'Default Team', 'Default team for testing', 1);

-- Update the admin user to be part of the default team
UPDATE users SET team_id = 1 WHERE id = 1; 