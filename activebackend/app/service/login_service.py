import logging
from database import get_connection
import psycopg2
import psycopg2.extras
import jwt
import bcrypt
from datetime import datetime, timedelta
from config import config
from fastapi import HTTPException, Depends, Request

def hash_password(password):
    """Hash password using bcrypt for security"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def verify_password(password, hashed_password):
    """Verify password against hashed password"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def decode_token(token: str):
    try:
        payload = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def login(email, password):
    """Login function for email and password"""
    logging.info(f"Called login with username={email}")
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Step 1: Fetch user by email only
        cursor.execute("""
            SELECT u.*, o.name as organization_name, o.id as organization_id, o.contact_email as org_contact_email
            FROM users u
            JOIN organizations o ON u.organization_id = o.id
            WHERE u.email = %s AND u.status = 'active'
        """, (email,))
        result = cursor.fetchone()

        if not result:
            logging.warning("Invalid email or password (user not found)")
            return {"success": False, "message": "Invalid email or password"}

        # Step 2: Verify password with bcrypt
        stored_hash = result["password"]
        if not bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")):
            logging.warning("Invalid email or password (wrong password)")
            return {"success": False, "message": "Invalid email or password"}

        # Step 3: Update last_active timestamp
        cursor.execute("UPDATE users SET last_active = NOW() WHERE id = %s", (result['id'],))

        # Step 4: Generate JWT token
        token_data = {
            "user_id": result['id'],
            "role": result['role'],
            "org_id": result['organization_id'],
            "exp": datetime.utcnow() + timedelta(hours=config.JWT_EXPIRY_HOURS)
        }
        token = jwt.encode(token_data, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM)

        conn.commit()
        logging.info(f"User {email} logged in successfully")

        # Step 5: Return response
        return {
            "success": True,
            "message": "Login successful",
            "token": token,
            "user": {
                "id": result['id'],
                "username": result['username'],
                "name": result['name'],
                "email": result['email'],
                "role": result['role'],
                "department": result['department'],
                "status": result['status'],
                "organization": {
                    "id": result['organization_id'],
                    "name": result['organization_name'],
                    "contact_email": result['org_contact_email']
                }
            }
        }

    except Exception as e:
        logging.error(f"Login failed: {e}", exc_info=True)
        return {"success": False, "message": "Internal server error"}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def check_username_availability(username, exclude_org_id=None):
    """
    Check if username exists in other organizations
    """
    try:
        with get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                if exclude_org_id:
                    cursor.execute("""
                        SELECT u.username, u.organization_id, o.name as org_name
                        FROM users u
                        JOIN organizations o ON u.organization_id = o.id
                        WHERE u.username = %s AND u.organization_id != %s
                    """, (username, exclude_org_id))
                else:
                    cursor.execute("""
                        SELECT u.username, u.organization_id, o.name as org_name
                        FROM users u
                        JOIN organizations o ON u.organization_id = o.id
                        WHERE u.username = %s
                    """, (username,))
                
                results = cursor.fetchall()
                return {
                    "username": username,
                    "exists_in_other_orgs": len(results) > 0,
                    "organizations": [{"org_id": r['organization_id'], "org_name": r['org_name']} for r in results]
                }
    except Exception as e:
        logging.error(f"Error checking username availability: {e}")
        return {"username": username, "exists_in_other_orgs": False, "organizations": []}

def get_user_login_info(user_id):
    """
    Get user login information and history
    """
    try:
        with get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT u.*, o.name as organization_name, o.id as organization_id
                    FROM users u
                    JOIN organizations o ON u.organization_id = o.id
                    WHERE u.id = %s
                """, (user_id,))
                
                result = cursor.fetchone()
                if result:
                    return {
                        "success": True,
                        "user": {
                            "id": result['id'],
                            "username": result['username'],
                            "name": result['name'],
                            "email": result['email'],
                            "role": result['role'],
                            "department": result['department'],
                            "status": result['status'],
                            "last_active": result['last_active'],
                            "organization": {
                                "id": result['organization_id'],
                                "name": result['organization_name']
                            }
                        }
                    }
                else:
                    return {"success": False, "message": "User not found"}
    except Exception as e:
        logging.error(f"Error getting user login info: {e}")
        return {"success": False, "message": "Error retrieving user information"}
 
def search_user_by_field(search_value, search_field='name'):
    """
    Search for user by different fields (name, username, email)
    """
    try:
        with get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                if search_field == 'name':
                    cursor.execute("""
                        SELECT u.*, o.name as organization_name, o.id as organization_id
                        FROM users u
                        JOIN organizations o ON u.organization_id = o.id
                        WHERE u.name = %s
                    """, (search_value,))
                elif search_field == 'username':
                    cursor.execute("""
                        SELECT u.*, o.name as organization_name, o.id as organization_id
                        FROM users u
                        JOIN organizations o ON u.organization_id = o.id
                        WHERE u.username = %s
                    """, (search_value,))
                elif search_field == 'email':
                    cursor.execute("""
                        SELECT u.*, o.name as organization_name, o.id as organization_id
                        FROM users u
                        JOIN organizations o ON u.organization_id = o.id
                        WHERE u.email = %s
                    """, (search_value,))
                else:
                    return {"success": False, "message": "Invalid search field"}
                
                result = cursor.fetchone()
                if result:
                    return {
                        "success": True,
                        "user": {
                            "id": result['id'],
                            "username": result['username'],
                            "name": result['name'],
                            "email": result['email'],
                            "role": result['role'],
                            "department": result['department'],
                            "status": result['status'],
                            "organization": {
                                "id": result['organization_id'],
                                "name": result['organization_name']
                            }
                        }
                    }
                else:
                    return {"success": False, "message": "User not found"}
    except Exception as e:
        logging.error(f"Error searching user: {e}")
        return {"success": False, "message": "Error searching user"}


 