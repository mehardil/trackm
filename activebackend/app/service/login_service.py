import logging
from database import get_connection
import psycopg2
import psycopg2.extras
import jwt
import bcrypt
from datetime import datetime, timedelta

SECRET_KEY = "mehardil123"

def hash_password(password):
    """Hash password using bcrypt for security"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def verify_password(password, hashed_password):
    """Verify password against hashed password"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

async def login(username, password):
    """
    Login function for organizations
    username can be either organization name or contact_email
    password should be the organization's password
    """
    logging.info(f"Called login with username={username}")
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # First, try to find the organization by username (could be name or email)
        cursor.execute("""
            SELECT * FROM organizations 
            WHERE (name = %s OR contact_email = %s) AND is_active = true
        """, (username, username))
        
        result = cursor.fetchone()
        
        if not result:
            logging.warning("Organization not found or not active")
            return {"success": False, "message": "Invalid username or password"}
        
        # Check if the organization has a password_hash field
        if 'password_hash' in result and result['password_hash']:
            # Verify the password against the stored hash
            if not verify_password(password, result['password_hash']):
                logging.warning("Invalid password for organization")
                return {"success": False, "message": "Invalid username or password"}
        else:
            # If no password_hash field exists, check if this is an OTP-based organization
            # For now, we'll allow login without password for organizations that don't have passwords set up
            # This is for backward compatibility
            logging.info("No password hash found for organization, allowing login for backward compatibility")
            # You might want to implement additional checks here if needed
        
        # Generate JWT token with organization data
        token_data = {
            "org_id": result['id'],
            "org_name": result['name'],
            "contact_email": result['contact_email'],
            "exp": datetime.utcnow() + timedelta(hours=24)  # Token expires in 24 hours
        }
        
        token = jwt.encode(token_data, SECRET_KEY, algorithm="HS256")
        
        logging.info("Login succeeded")
        return {
            "success": True, 
            "message": "Login successful", 
            "token": token,
            "organization": {
                "id": result['id'],
                "name": result['name'],
                "contact_email": result['contact_email'],
                "description": result.get('description'),
                "is_active": result['is_active']
            }
        }
        
    except Exception as e:
        logging.error(f"Login failed: {e}")
        return {"success": False, "message": "Internal server error"}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
 