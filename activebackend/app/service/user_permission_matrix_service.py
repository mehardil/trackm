from database import get_connection
import psycopg2
import psycopg2.extras
import logging
from typing import List, Dict, Any, Optional

async def get_user_permission_matrix(organization_id: int) -> List[Dict[str, Any]]:
    """
    Get user permission matrix for an organization
    Returns permissions as rows and users as columns with access status
    """
    logging.info(f"Getting user permission matrix for organization_id={organization_id}")
    try:
        conn = get_connection()
        if conn is None:
            logging.error("Failed to establish database connection")
            return []
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Get all permissions
        cursor.execute("SELECT id, code, module FROM permissions ORDER BY module, id")
        permissions = cursor.fetchall()
        
        # Get all users in the organization
        cursor.execute("""
            SELECT id, name, email, role, status
            FROM users 
            WHERE organization_id = %s AND status = 'active'
            ORDER BY role, name
        """, (organization_id,))
        users = cursor.fetchall()
        
        # Get role permissions for all roles
        cursor.execute("""
            SELECT rp.role, p.module, rp.has_access
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
        """)
        role_permissions = {}
        for row in cursor.fetchall():
            role = row['role']
            module = row['module']
            if role not in role_permissions:
                role_permissions[role] = {}
            role_permissions[role][module] = row['has_access']
        
        # Get user-specific permissions
        cursor.execute("""
            SELECT up.user_id, p.module, up.has_access
            FROM user_permissions up
            JOIN permissions p ON up.permission_id = p.id
            WHERE up.organization_id = %s
        """, (organization_id,))
        user_permissions = {}
        for row in cursor.fetchall():
            user_id = row['user_id']
            module = row['module']
            if user_id not in user_permissions:
                user_permissions[user_id] = {}
            user_permissions[user_id][module] = row['has_access']
        
        # Build the matrix
        matrix = []
        for perm in permissions:
            permission_data = {
                "id": perm['id'],
                "code": perm['code'],
                "module": perm['module'],
                "users": {}
            }
            
            for user in users:
                user_id = user['id']
                user_role = user['role']
                user_name = user['name']
                user_email = user['email']
                
                # Check user-specific permission first, then role permission
                user_specific_access = user_permissions.get(user_id, {}).get(perm['module'])
                role_access = role_permissions.get(user_role, {}).get(perm['module'], False)
                
                # User-specific permission takes precedence
                final_access = user_specific_access if user_specific_access is not None else role_access
                
                permission_data["users"][str(user_id)] = {
                    "user_id": user_id,
                    "user_name": user_name,
                    "user_email": user_email,
                    "user_role": user_role,
                    "has_access": final_access,
                    "permission_source": "user_specific" if user_specific_access is not None else "role_based"
                }
            
            matrix.append(permission_data)
        
        cursor.close()
        conn.close()
        
        logging.info(f"Retrieved user permission matrix with {len(matrix)} permissions for organization {organization_id}")
        return matrix
        
    except Exception as e:
        logging.error(f"Error getting user permission matrix for organization {organization_id}: {e}")
        raise

async def get_users_in_organization(organization_id: int) -> List[Dict[str, Any]]:
    """
    Get all users in an organization
    """
    logging.info(f"Getting users for organization_id={organization_id}")
    try:
        conn = get_connection()
        if conn is None:
            logging.error("Failed to establish database connection")
            return []
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cursor.execute("""
            SELECT id, name, email, role, status, department
            FROM users 
            WHERE organization_id = %s AND status = 'active'
            ORDER BY role, name
        """, (organization_id,))
        
        users = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        logging.info(f"Found {len(users)} users in organization {organization_id}")
        return [dict(user) for user in users]
        
    except Exception as e:
        logging.error(f"Error getting users for organization {organization_id}: {e}")
        raise

async def update_user_permission(user_id: int, permission_id: int, has_access: bool, organization_id: int) -> bool:
    """
    Update a single user permission
    """
    logging.info(f"Updating user permission: user_id={user_id}, permission_id={permission_id}, has_access={has_access}")
    try:
        conn = get_connection()
        if conn is None:
            logging.error("Failed to establish database connection")
            return False
        
        cursor = conn.cursor()
        
        # Insert or update user permission
        cursor.execute("""
            INSERT INTO user_permissions (user_id, permission_id, has_access, organization_id)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (user_id, permission_id, organization_id)
            DO UPDATE SET has_access = EXCLUDED.has_access
        """, (user_id, permission_id, has_access, organization_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logging.info(f"Successfully updated user permission")
        return True
        
    except Exception as e:
        logging.error(f"Error updating user permission: {e}")
        if conn:
            conn.rollback()
        raise

async def get_permission_users_matrix(organization_id: int) -> Dict[str, Any]:
    """
    Get a complete matrix showing permissions as rows and users as columns
    Returns both the matrix data and metadata about users and permissions
    """
    logging.info(f"Getting permission-users matrix for organization_id={organization_id}")
    try:
        # Get the matrix data
        matrix = await get_user_permission_matrix(organization_id)
        
        # Get users metadata
        users = await get_users_in_organization(organization_id)
        
        # Get permissions metadata
        conn = get_connection()
        if conn is None:
            logging.error("Failed to establish database connection")
            return {}
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT id, code, module FROM permissions ORDER BY module, id")
        permissions = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {
            "matrix": matrix,
            "users": users,
            "permissions": [dict(perm) for perm in permissions],
            "organization_id": organization_id
        }
        
    except Exception as e:
        logging.error(f"Error getting permission-users matrix: {e}")
        raise

