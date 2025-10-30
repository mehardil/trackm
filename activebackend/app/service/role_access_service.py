from database import get_connection
import psycopg2
import psycopg2.extras
import logging
from typing import List, Dict, Any, Optional

async def get_role_access_for_organization(organization_id: int) -> List[Dict[str, Any]]:
    """
    Get role access configuration for all users in an organization
    Returns the final access permissions for each user based on role and user-specific permissions
    """
    logging.info(f"Getting role access for organization_id={organization_id}")
    try:
        conn = get_connection()
        if conn is None:
            logging.error("Failed to establish database connection")
            return []
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Query to get user permissions with role-based fallback
        query = """
        SELECT 
            u.id AS user_id,
            u.organization_id,
            u.role,
            u.name as user_name,
            u.email as user_email,
            p.module,
            p.code,
            COALESCE(up.has_access, rp.has_access) AS final_access
        FROM users u
        JOIN role_permissions rp 
            ON u.role = rp.role
        JOIN permissions p 
            ON rp.permission_id = p.id
        LEFT JOIN user_permissions up 
            ON up.user_id = u.id 
           AND up.permission_id = p.id 
           AND up.organization_id = u.organization_id
        WHERE u.organization_id = %s AND u.status = 'active'
        ORDER BY u.id, p.id
        """
        
        cursor.execute(query, (organization_id,))
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        logging.info(f"Retrieved {len(results)} role access records for organization {organization_id}")
        return [dict(row) for row in results]
        
    except Exception as e:
        logging.error(f"Error getting role access for organization {organization_id}: {e}")
        raise

async def get_role_permissions(role: str) -> List[Dict[str, Any]]:
    """
    Get all permissions for a specific role
    """
    logging.info(f"Getting permissions for role={role}")
    try:
        conn = get_connection()
        if conn is None:
            logging.error("Failed to establish database connection")
            return []
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        query = """
        SELECT 
            rp.id,
            rp.role,
            rp.permission_id,
            rp.has_access,
            p.module,
            p.code
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role = %s
        ORDER BY p.id
        """
        
        cursor.execute(query, (role,))
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        logging.info(f"Retrieved {len(results)} permissions for role {role}")
        return [dict(row) for row in results]
        
    except Exception as e:
        logging.error(f"Error getting permissions for role {role}: {e}")
        raise

async def get_user_permissions(user_id: int, organization_id: int) -> List[Dict[str, Any]]:
    """
    Get all permissions for a specific user (including role-based and user-specific)
    """
    logging.info(f"Getting permissions for user_id={user_id} in organization_id={organization_id}")
    try:
        conn = get_connection()
        if conn is None:
            logging.error("Failed to establish database connection")
            return []
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        query = """
        SELECT 
            u.id AS user_id,
            u.organization_id,
            u.role,
            u.name as user_name,
            u.email as user_email,
            p.module,
            p.code,
            COALESCE(up.has_access, rp.has_access) AS final_access,
            CASE 
                WHEN up.has_access IS NOT NULL THEN 'user_specific'
                ELSE 'role_based'
            END as permission_source
        FROM users u
        JOIN role_permissions rp 
            ON u.role = rp.role
        JOIN permissions p 
            ON rp.permission_id = p.id
        LEFT JOIN user_permissions up 
            ON up.user_id = u.id 
           AND up.permission_id = p.id 
           AND up.organization_id = u.organization_id
        WHERE u.id = %s AND u.organization_id = %s
        ORDER BY p.id
        """
        
        cursor.execute(query, (user_id, organization_id))
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        logging.info(f"Retrieved {len(results)} permissions for user {user_id}")
        return [dict(row) for row in results]
        
    except Exception as e:
        logging.error(f"Error getting permissions for user {user_id}: {e}")
        raise

async def update_role_permissions(role: str, permissions: List[Dict[str, Any]]) -> bool:
    """
    Update permissions for a specific role
    """
    logging.info(f"Updating permissions for role={role}")
    try:
        conn = get_connection()
        if conn is None:
            logging.error("Failed to establish database connection")
            return False
        
        cursor = conn.cursor()
        
        # First, delete existing permissions for this role
        cursor.execute("DELETE FROM role_permissions WHERE role = %s", (role,))
        
        # Insert new permissions
        for perm in permissions:
            cursor.execute("""
                INSERT INTO role_permissions (role, permission_id, has_access)
                VALUES (%s, %s, %s)
            """, (role, perm['permission_id'], perm['has_access']))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logging.info(f"Successfully updated {len(permissions)} permissions for role {role}")
        return True
        
    except Exception as e:
        logging.error(f"Error updating permissions for role {role}: {e}")
        if conn:
            conn.rollback()
        raise

async def update_user_permissions(user_id: int, organization_id: int, permissions: List[Dict[str, Any]]) -> bool:
    """
    Update user-specific permissions
    """
    logging.info(f"Updating permissions for user_id={user_id}")
    try:
        conn = get_connection()
        if conn is None:
            logging.error("Failed to establish database connection")
            return False
        
        cursor = conn.cursor()
        
        # First, delete existing user-specific permissions
        cursor.execute("""
            DELETE FROM user_permissions 
            WHERE user_id = %s AND organization_id = %s
        """, (user_id, organization_id))
        
        # Insert new user-specific permissions
        for perm in permissions:
            cursor.execute("""
                INSERT INTO user_permissions (user_id, permission_id, has_access, organization_id)
                VALUES (%s, %s, %s, %s)
            """, (user_id, perm['permission_id'], perm['has_access'], organization_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logging.info(f"Successfully updated {len(permissions)} user-specific permissions for user {user_id}")
        return True
        
    except Exception as e:
        logging.error(f"Error updating user permissions for user {user_id}: {e}")
        if conn:
            conn.rollback()
        raise

async def get_all_permissions() -> List[Dict[str, Any]]:
    """
    Get all available permissions in the system
    """
    logging.info("Getting all permissions")
    try:
        conn = get_connection()
        if conn is None:
            logging.error("Failed to establish database connection")
            return []
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        query = "SELECT * FROM permissions ORDER BY id"
        cursor.execute(query)
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        logging.info(f"Retrieved {len(results)} permissions")
        return [dict(row) for row in results]
        
    except Exception as e:
        logging.error(f"Error getting all permissions: {e}")
        raise

async def get_roles_in_organization(organization_id: int) -> List[str]:
    """
    Get all unique roles in an organization
    """
    logging.info(f"Getting roles in organization_id={organization_id}")
    try:
        conn = get_connection()
        if conn is None:
            logging.error("Failed to establish database connection")
            return []
        
        cursor = conn.cursor()
        
        query = """
        SELECT DISTINCT role 
        FROM users 
        WHERE organization_id = %s AND status = 'active'
        ORDER BY role
        """
        
        cursor.execute(query, (organization_id,))
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        roles = [row[0] for row in results]
        logging.info(f"Retrieved roles: {roles}")
        return roles
        
    except Exception as e:
        logging.error(f"Error getting roles for organization {organization_id}: {e}")
        raise
