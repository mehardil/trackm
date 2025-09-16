# Setting Up ActivTrack on a Linux Server

This guide provides step-by-step instructions for deploying the ActivTrack application on a Linux server.

## Prerequisites

- A Linux server (Ubuntu 20.04 LTS or later recommended)
- Node.js 18+ installed
- PostgreSQL database
- Nginx for reverse proxy (recommended)
- Domain name pointing to your server (optional, but recommended)

## Step 1: Install Dependencies

```bash
# Update system packages
sudo apt update
sudo apt upgrade -y

# Install Node.js 18.x if not already installed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2
```

## Step 2: Create PostgreSQL Database

```bash
# Log in to PostgreSQL
sudo -u postgres psql

# Create a database and user
CREATE DATABASE activtrack;
CREATE USER activtrackuser WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE activtrack TO activtrackuser;
\q

# Note: Remember to update your .env file with these credentials
```

## Step 3: Clone and Set Up the Application

```bash
# Clone the repository
git clone https://github.com/your-repo/activtrack.git
cd activtrack

# Install dependencies
npm install

# Create .env file (update with your values)
cat > .env << EOL
DATABASE_URL=postgresql://activtrackuser:your_secure_password@localhost:5432/activtrack
VITE_API_URL=https://yourdomain.com/api
VITE_WS_URL=wss://yourdomain.com/ws
# Add Stripe keys if using payment features
STRIPE_SECRET_KEY=sk_test_yourkeyhere
VITE_STRIPE_PUBLIC_KEY=pk_test_yourkeyhere
EOL

# Initialize the database
npm run db:push

# Build the application
npm run build
```

## Step 4: Configure PM2 for Process Management

```bash
# Start application with PM2
pm2 start npm --name "activtrack" -- run start

# Ensure PM2 starts on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp $(echo $HOME)
pm2 save
```

## Step 5: Configure Nginx as a Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/activtrack

# Add the following configuration (update as needed)
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket specific configuration
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400; # Timeout for WebSocket connections (24h)
    }
}
```

```bash
# Enable the site and restart Nginx
sudo ln -s /etc/nginx/sites-available/activtrack /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

## Step 6: Set Up SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically update your Nginx configuration
# Verify automatic renewal is set up
sudo systemctl status certbot.timer
```

## Step 7: Securing Your Server

```bash
# Configure firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable

# Secure PostgreSQL (basic settings)
sudo nano /etc/postgresql/12/main/pg_hba.conf
# Modify access rules as needed

sudo nano /etc/postgresql/12/main/postgresql.conf
# Set listen_addresses = 'localhost'

sudo systemctl restart postgresql
```

## Maintenance Tasks

### Updating the Application

```bash
# Navigate to your application directory
cd /path/to/activtrack

# Pull latest changes
git pull

# Install dependencies if needed
npm install

# Rebuild the application
npm run build

# Restart PM2 process
pm2 restart activtrack
```

### Database Backups

```bash
# Create a backup script
cat > backup_db.sh << EOL
#!/bin/bash
BACKUP_DIR="/path/to/backups"
TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="\$BACKUP_DIR/activtrack_\$TIMESTAMP.sql"

# Ensure backup directory exists
mkdir -p \$BACKUP_DIR

# Create backup
pg_dump -U activtrackuser -h localhost activtrack > \$BACKUP_FILE

# Compress backup
gzip \$BACKUP_FILE

# Remove backups older than 30 days
find \$BACKUP_DIR -name "activtrack_*.sql.gz" -mtime +30 -delete
EOL

# Make the script executable
chmod +x backup_db.sh

# Set up a cron job to run daily
(crontab -l 2>/dev/null; echo "0 2 * * * /path/to/backup_db.sh") | crontab -
```

## Troubleshooting

### Check Application Logs

```bash
pm2 logs activtrack
```

### Check Nginx Logs

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Check PostgreSQL Logs

```bash
sudo tail -f /var/log/postgresql/postgresql-12-main.log
```

### Common Issues

1. **Connection refused to database**: Check PostgreSQL is running and credentials are correct
   ```bash
   sudo systemctl status postgresql
   ```

2. **Application not starting**: Check Node.js version and package compatibility
   ```bash
   node -v
   npm -v
   ```

3. **WebSocket connection issues**: Ensure Nginx is properly configured for WebSocket proxying
   ```bash
   sudo nginx -t
   ```