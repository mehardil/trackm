from database import get_connection
import psycopg2
import psycopg2.extras
import logging
import bcrypt
from service.signup_service import create_organization_from_user_data
from config import config

def hash_password(password: str) -> str:
    """Hash password using bcrypt for security"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against hashed password"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    


async def create_user(user_data: dict):
    print(f"Called create_user with user_data={user_data}")
    try:
        conn = get_connection()
        if conn is None:
            return {"success": False, "message": "Database connection failed"}
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        user_name = user_data.get('username', '')
        business_email = user_data.get('business_email', '')
        password = user_data.get('password', '')
        department = user_data.get('department', '') 
        userrole = user_data.get('userrole', '')
        organization_id = user_data.get('org_id','')
        creater_id = user_data.get('user_id','')
        print(userrole ,"here is role of user")
        
        # Validate required fields
        if not user_name:
            raise ValueError("First name and last name are required")
        if not business_email:
            raise ValueError("Business email is required")
        if not password:
            raise ValueError("Password is required")
        
        # Combine first and last name for user's full name
        user_full_name = f"{user_name}".strip()
        username = business_email.split('@')[0] if business_email else user_full_name.lower().replace(' ', '_')
        
        # Set role based on whether user is admin or not
        sql = "select role from users where id = %s"
        cursor.execute(sql, (creater_id,))
        creater_role = cursor.fetchone()
        if creater_role['role'] != 'admin':
            raise ValueError("creater is not admin so unable to create new user")

        avatar_color = '#FF6B6B'
        is_agent = False
        # Insert the new user into the users table
        sql = """
            INSERT INTO users (organization_id, username, password, name, email, department, role, avatar_color, status, is_agent)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, username, name, email, status, role
        """
        cursor.execute(sql, (
            organization_id, username,hash_password(password),user_full_name,business_email,department,userrole,avatar_color,'active', is_agent
        ))
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        logging.info("create_user succeeded")
        logging.info(f"User created: {user_full_name} ({username}) for organization:")
        message = "User created successfully"
        print(result ,"result")
        return {
            "success": True,
            "message": message,
            "user": result,
            "organization_id": organization_id,
            "userrole": userrole,
            "business_email":business_email
        }
    except psycopg2.errors.UniqueViolation:
        logging.error("Username or email already exists")
        return {"success": False, "message": "Username or email already exists"}
    except ValueError as ve:
        logging.error(f"Validation error: {ve}")
        return {"success": False, "message": str(ve)}
    except Exception as e:
        logging.error(f"create_user failed: {e}")
        raise



async def create_admin_user_for_organization(org_id: int, org_name: str, contact_email: str, contact_phone: str = None):
    """Create an admin user when a new organization is created"""
    logging.info(f"Creating admin user for organization {org_id}")
    try:
        conn = get_connection()
        if conn is None:
            return {"success": False, "message": "Database connection failed"}
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        admin_name = f"{org_name} Admin"
        admin_email = contact_email
        admin_username = f"admin_{org_name.lower().replace(' ', '_')}"
        sql = """
            INSERT INTO "user" (organization_id, username, password, name, email, department, role, avatar_color, status, is_agent)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, username, name, email, role, status
        """
        
        cursor.execute(sql, (
            org_id,
            admin_username,
            '',  
            admin_name,
            admin_email,
            'Administration',
            'viewer', 
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





async def create_user_admin(user_data: dict):
    logging.info(f"Called create_user with user_data={user_data}")
    try:
        conn = get_connection()
        if conn is None:
            return {"success": False, "message": "Database connection failed"}
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        first_name = user_data.get('first_name', '')
        last_name = user_data.get('last_name', '')
        phone_number = user_data.get('phone_number', '')  
        organization_name = user_data.get('organization', '')  
        business_email = user_data.get('business_email', '')
        password = user_data.get('password', '')
        country = user_data.get('country', '')
        password = hash_password(password) 
        
        # Validate required fields
        if not first_name or not last_name:
            raise ValueError("First name and last name are required")
        if not business_email:
            raise ValueError("Business email is required")
        if not password:
            raise ValueError("Password is required")
        if not organization_name:
            raise ValueError("Organization name is required")
        
        # Create or find the organization
        try:
            organization = create_organization_from_user_data(user_data)
            organization_id = organization.get('org_id')
            logging.info(f"Organization ID for user: {organization_id}")
        except Exception as e:
            logging.error(f"Failed to create/find organization: {e}")
            raise ValueError(f"Failed to create/find organization: {str(e)}")
        
        # Check if this is the first user for this organization (admin user)
        cursor.execute("SELECT COUNT(*) as user_count FROM users WHERE organization_id = %s", (organization_id,))
        user_count = cursor.fetchone()['user_count']
        is_admin = user_count == 0  
        user_full_name = f"{first_name} {last_name}".strip()
        username = user_full_name
        role = 'admin' if is_admin else user_data.get('role', 'viewer')
        avatar_color = '#FF6B6B' if is_admin else user_data.get('avatar_color', '#3B82F6')  
        department = user_data.get('department', 'Administration' if is_admin else '')
        is_agent = False
        
        # Insert the new user into the users table
        sql = """
            INSERT INTO users (organization_id, username, password, name, email, department, role, avatar_color, status, is_agent)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, username, name, email, status, role
        """
        cursor.execute(sql, (organization_id,  username,  password, user_full_name,  business_email,department,role,avatar_color,'active',  is_agent))
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        logging.info("create_user succeeded")
        logging.info(f"User created: {user_full_name} ({username}) for organization: {organization_name}")
        logging.info(f"User role: {role} (is_admin: {is_admin})")
        
        return {
            "success": True,
            "message": "User and organization created successfully. Please verify OTP to activate.",
            "user": result,
            "organization_id": organization_id,
            "organization_name": organization_name,  
            "is_admin": is_admin,
            "otp_info": {
                "message": "OTP has been sent to your email. Use it to activate your organization.",
                "organization_id": organization_id,
                "email": business_email
            },
            "user_details": {
                "full_name": user_full_name,
                "username": username,
                "email": business_email,
                "phone": phone_number,
                "country": country,
                "role": role,
                "department": department
            }
        }
        
    except psycopg2.errors.UniqueViolation:
        logging.error("Username or email already exists")
        return {"success": False, "message": "Username or email already exists"}
    except ValueError as ve:
        logging.error(f"Validation error: {ve}")
        return {"success": False, "message": str(ve)}
    except Exception as e:
        logging.error(f"create_user failed: {e}")
        raise




def get_users_in_organization(org_id,role):
    """Get all users in a specific organization"""
    
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
            cursor.execute("""
                SELECT u.name, u.email, u.role, u.department FROM users u WHERE u.organization_id = %s and 
                u.is_agent = %s ORDER BY u.name
              """, (org_id,role))
            users = cursor.fetchall()
            print(users)
            return {
                "success": True,
                "organization_id": org_id,
                "users": [
                    {
                    "name": user['name'],
                    "email": user['email'],
                    "role": user['role'],
                    "department": user['department']
                    }
                    for user in users
                ]
            }
