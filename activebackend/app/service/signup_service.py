from database import get_connection
import psycopg2
import psycopg2.extras
import json
import logging
import random
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
import threading
import bcrypt
from config import config

def hash_password(password):
    """Hash password using bcrypt for security"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def send_otp_email(email, otp):
    msg = MIMEText(f"Your organization OTP is: {otp}")
    msg["Subject"] = "Organization Signup OTP"
    msg["From"] = config.SMTP_EMAIL
    msg["To"] = email
    try:
        with smtplib.SMTP_SSL(config.SMTP_SERVER, config.SMTP_PORT) as server:
            server.login(config.SMTP_EMAIL, config.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        logging.error(f"Failed to send OTP email: {e}")
        return False

def send_otp_email_background(email, otp):
    thread = threading.Thread(target=send_otp_email, args=(email, otp))
    thread.daemon = True
    thread.start()


def create_organization_from_user_data(user_data: dict):
    """Create organization from user registration data"""
    result = None
    try:
        with get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                organization_name = user_data.get('organization', '')
                business_email = user_data.get('business_email', '')
                phone_number = user_data.get('phone_number', '')
                country = user_data.get('country', '')
                first_name = user_data.get('first_name', '')
                last_name = user_data.get('last_name', '')
                
                # Validate required fields
                if not organization_name:
                    raise ValueError("Organization name is required")
                if not business_email:
                    raise ValueError("Business email is required")
                if not first_name or not last_name:
                    raise ValueError("First name and last name are required")
                
                cursor.execute("SELECT id, is_active FROM organizations WHERE name = %s", (organization_name,))
                existing_org = cursor.fetchone()
                if existing_org:
                    org_id = existing_org['id']
                    org_was_active = existing_org['is_active']
                    logging.info(f"Organization '{organization_name}' already exists")
                    return {
                        "org_id": org_id,
                        "existed_before": True,
                        "was_active": org_was_active
                    }
                
                # Create new organization with all available data
                description = f"Organization created for {first_name} {last_name}"
                contact_phone = phone_number if phone_number else ''
                logo_url = ''
                settings = {
                    "country": country if country else '',
                    "phone_number": phone_number if phone_number else '',
                    "created_from_user_signup": True,
                    "created_at": datetime.utcnow().isoformat(),
                    "user_info": {
                        "first_name": first_name,
                        "last_name": last_name,
                        "email": business_email
                    }
                }
                
                query = """
                    INSERT INTO organizations (name, description, contact_email, contact_phone, logo_url, is_active, settings)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """
                cursor.execute(query, (organization_name,description,business_email,contact_phone,logo_url,False,  json.dumps(settings)))
                org_id = cursor.fetchone()['id']
                
                # Create OTP for organization verification
                otp = random.randint(100000, 999999)
                expiry = datetime.utcnow() + timedelta(minutes=10)
                cursor.execute("INSERT INTO organization_otps (org_id, otp, expiry) VALUES (%s, %s, %s)",(org_id, otp, expiry))
                conn.commit()
                send_otp_email_background(business_email, otp)
                logging.info(f"Organization '{organization_name}' created with ID: {org_id}")
                logging.info(f"Organization details: {organization_name}, {business_email}, {contact_phone}, {country}")
                return {
                    "org_id": org_id,
                    "existed_before": False,
                    "was_active": False
                }
                
    except Exception as e:
        logging.error(f"Error creating organization from user data: {e}")
        raise

def create_organization(data):
    result = None
    try:
        with get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                # For now, we'll skip password hashing until the column is added
                # TODO: Add password_hash column to organizations table first
                
                # Extract data from frontend with defaults for missing fields
                name = data.get('name', '')
                description = data.get('description', '')  # Default empty string
                contact_email = data.get('contact_email', '')
                contact_phone = data.get('contact_phone', '')  # Default empty string
                logo_url = data.get('logo_url', '')  # Default empty string
                settings = data.get('settings', {})  # Default empty dict
                
                # Validate required fields
                if not name or not contact_email:
                    raise ValueError("Organization name and contact email are required")
                
                query = """
                    INSERT INTO organizations (name, description, contact_email, contact_phone, logo_url, is_active, settings)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """
                cursor.execute(query, (
                    name,
                    description,
                    contact_email,
                    contact_phone,
                    logo_url,
                    False,  # is_active starts as False until OTP verification
                    json.dumps(settings)
                ))
                org_id = cursor.fetchone()['id']
                
                # Create OTP for organization verification
                otp = random.randint(100000, 999999)
                expiry = datetime.utcnow() + timedelta(minutes=10)
                cursor.execute(
                    "INSERT INTO organization_otps (org_id, otp, expiry) VALUES (%s, %s, %s)",
                    (org_id, otp, expiry)
                )
                
                conn.commit()
                
                # Send OTP email
                send_otp_email_background(contact_email, otp)
                
                result = {
                    "org_id": org_id, 
                    "message": "Organization created. OTP sent to email.",
                }
    except psycopg2.errors.UniqueViolation:
        raise ValueError("Organization name already exists.")
    except Exception as e:
        logging.error(f"Error creating organization: {e}")
        raise
    return result






def verify_organization_otp(org_id, otp):
    """Verify OTP and activate organization"""
    result = False
    try:
        with get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                otp_str = str(otp)
                cursor.execute(
                    "SELECT 1 FROM organization_otps WHERE org_id = %s AND otp = %s AND expiry > %s",
                    (org_id, otp_str, datetime.utcnow())
                )
                otp_record = cursor.fetchone()
                
                if otp_record:
                    cursor.execute(
                        "UPDATE organizations SET is_active = %s WHERE id = %s",
                        (True, org_id)
                    )
                    cursor.execute(
                        "UPDATE users SET status = %s WHERE organization_id = %s",
                        ('active', org_id)
                    )
                    cursor.execute(
                        "DELETE FROM organization_otps WHERE org_id = %s",
                        (org_id,)
                    )
                    
                    conn.commit()
                    result = True
                    logging.info(f"Organization {org_id} activated successfully via OTP verification")
                else:
                    logging.warning(f"Invalid or expired OTP for organization {org_id}")
                    
    except Exception as e:
        logging.error(f"Error verifying OTP: {e}")
        raise
    return result

async def create_admin_user_for_organization(org_id: int, org_name: str, contact_email: str, contact_phone: str = None):
    """Create an admin user when a new organization is created"""
    logging.info(f"Creating admin user for organization {org_id}")
    try:
        with get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                
                admin_name = f"{org_name} Admin"
                admin_email = contact_email
                admin_username = f"admin_{org_name.lower().replace(' ', '_')}"
                
                # Insert the admin user into the users table
                sql = """
                    INSERT INTO users (organization_id, username, password, name, email, department, role, avatar_color, status, is_agent)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, username, name, email, role, status
                """
                
                cursor.execute(sql, (
                    org_id,
                    admin_username,
                    hash_password('admin123'),  # Hash the default admin password
                    admin_name,
                    admin_email,
                    'Administration',
                    'admin', 
                    '#FF6B6B', 
                    'active',
                    False
                ))
                
                result = cursor.fetchone()
                conn.commit()
                cursor.close()
                conn.close()
                
                logging.info(f"Admin user created successfully: {result}")
                return result
                
    except Exception as e:
        logging.error(f"Failed to create admin user: {e}")
        raise