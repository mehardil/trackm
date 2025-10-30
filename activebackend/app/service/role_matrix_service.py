from database import get_connection
import psycopg2
import psycopg2.extras
import logging
from typing import List, Dict, Any, Optional

async def get_role_matrix_optimized(organization_id: int) -> List[Dict[str, Any]]:
    """
    OPTIMIZED: Get role access matrix for an organization
    Returns modules as rows and roles as columns with permission status
    Uses single query with CTEs for better performance
    """
    logging.info(f"Getting role matrix for organization_id={organization_id}")
    try:
        conn = get_connection()
        if conn is None:
            logging.error("Failed to establish database connection")
            return []
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Single optimized query to get all data at once
        cursor.execute("""
            WITH org_stats AS (
                SELECT COUNT(*) as user_count
                FROM users
                WHERE organization_id = %s AND status = 'active'
            ),
            org_roles AS (
                SELECT DISTINCT role 
                FROM users 
                WHERE organization_id = %s AND status = 'active'
                ORDER BY role
            ),
            modules AS (
                SELECT DISTINCT module 
                FROM permissions 
                ORDER BY module
            ),
            role_perms AS (
                SELECT rp.role, p.module, rp.has_access
                FROM role_permissions rp
                JOIN permissions p ON rp.permission_id = p.id
                WHERE rp.role IN (SELECT role FROM org_roles)
            )
            SELECT 
                (SELECT user_count FROM org_stats) as user_count,
                (SELECT array_agg(role) FROM org_roles) as roles,
                (SELECT array_agg(module) FROM modules) as modules,
                json_object_agg(
                    CASE WHEN rp.role IS NOT NULL THEN rp.role || '|' || rp.module ELSE NULL END,
                    rp.has_access
                ) as permissions
            FROM role_perms rp
        """, (organization_id, organization_id))
        
        result = cursor.fetchone()
        user_count = result['user_count'] if result else 0
        roles = result['roles'] if result and result['roles'] else []
        modules = result['modules'] if result and result['modules'] else []
        permissions_map = result['permissions'] if result and result['permissions'] else {}

        # Build organization-scoped overrides from org_role_permissions (role-level per org) and user_permissions
        org_override_map: Dict[str, bool] = {}
        # 1) Org-level role overrides
        cursor.execute(
            """
            SELECT role, p.module, orp.has_access
            FROM org_role_permissions orp
            JOIN permissions p ON p.id = orp.permission_id
            WHERE orp.organization_id = %s
            """,
            (organization_id,)
        )
        for row in cursor.fetchall():
            org_override_map[f"{row['role']}|{row['module']}"] = row['has_access']
        
        # 2) Aggregate user-specific overrides for the org (if no org-level override for key)
        if roles and modules:
            cursor.execute(
                """
                SELECT u.role, p.module, BOOL_AND(up.has_access) AS all_true, BOOL_OR(up.has_access) AS any_true
                FROM users u
                JOIN user_permissions up 
                    ON up.user_id = u.id 
                   AND up.organization_id = %s
                JOIN permissions p 
                    ON p.id = up.permission_id
                WHERE u.organization_id = %s AND u.status = 'active'
                GROUP BY u.role, p.module
                """,
                (organization_id, organization_id),
            )
            for row in cursor.fetchall():
                key = f"{row['role']}|{row['module']}"
                if key in org_override_map:
                    continue
                all_true = row["all_true"]
                any_true = row["any_true"]
                # If users disagree, prefer no access for safety
                effective = True if (all_true and any_true) else False
                org_override_map[key] = effective
        
        # Build matrix efficiently
        matrix = []
        
        # Check if this is truly a new organization (no role_permissions exist yet)
        cursor.execute("SELECT COUNT(*) AS cnt FROM role_permissions")
        existing_role_perms_row = cursor.fetchone()
        existing_role_perms = existing_role_perms_row["cnt"] if isinstance(existing_role_perms_row, dict) else existing_role_perms_row[0]
        is_truly_new_org = existing_role_perms == 0 and user_count <= 1
        
        if is_truly_new_org:
            # Only compute default permissions for truly new organizations (do NOT write in GET)
            default_roles = ["admin", "editor", "viewer"]
            restricted_modules = {"classification", "role access", "role-access"}
            matrix = []
            for module in modules:
                perms = {r: "access" for r in default_roles}
                if isinstance(module, dict):
                    module_name = module.get("module", "")
                else:
                    module_name = module
                if module_name.lower() in restricted_modules:
                    perms["editor"] = "none"
                    perms["viewer"] = "none"
                matrix.append({"section": module_name, "permissions": perms})
        else:
            # Build matrix for existing organization - respect admin changes
            for module in modules:
                permissions = {}
                for role in roles:
                    key = f"{role}|{module}"
                    # Prefer organization overrides if present; else fall back to global role permissions
                    if key in org_override_map:
                        has_access = org_override_map[key]
                    else:
                        has_access = permissions_map.get(key, False)
                    permissions[role] = "access" if has_access else "none"
                # In established orgs, admin Settings may be immutable (always)
                if module == "Settings" and "admin" in permissions:
                    permissions["admin"] = "always"
                matrix.append({"section": module, "permissions": permissions})
        
        cursor.close()
        conn.close()
        logging.info(f"Successfully retrieved role matrix for organization {organization_id}")
        return matrix
    except Exception as e:
        logging.error(f"Error getting role matrix for organization {organization_id}: {e}")
        raise

async def get_role_matrix(organization_id: int) -> List[Dict[str, Any]]:
    """
    Get role access matrix for an organization
    Returns modules as rows and roles as columns with permission status
    """
    logging.info(f"Getting role matrix for organization_id={organization_id}")
    try:
        conn = get_connection()
        if conn is None:
            logging.error("Failed to establish database connection")
            return []
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT DISTINCT module FROM permissions ORDER BY module")
        modules = cursor.fetchall()
        cursor.execute(
            """
            SELECT COUNT(*) AS user_count
            FROM users
            WHERE organization_id = %s AND status = 'active'
            """,
            (organization_id,),
        )
        org_info = cursor.fetchone() or {"user_count": 0}
        user_count = org_info["user_count"]
        cursor.execute(
            """
            SELECT DISTINCT role 
            FROM users 
            WHERE organization_id = %s AND status = 'active'
            ORDER BY role
            """,
            (organization_id,),
        )
        roles = cursor.fetchall()
        role_permissions = {}
        for role in roles:
            role_name = role['role']
            cursor.execute(
                """
                SELECT p.module, p.code, rp.has_access
                FROM role_permissions rp
                JOIN permissions p ON rp.permission_id = p.id
                WHERE rp.role = %s
                ORDER BY p.module
                """,
                (role_name,),
            )
            role_permissions[role_name] = {
                row['module']: row['has_access'] for row in cursor.fetchall()
            }
        
        
        matrix = []
        
        # Check if this is truly a new organization (no role_permissions exist yet)
        cursor.execute("SELECT COUNT(*) AS cnt FROM role_permissions")
        existing_role_perms_row = cursor.fetchone()
        existing_role_perms = existing_role_perms_row["cnt"] if isinstance(existing_role_perms_row, dict) else existing_role_perms_row[0]
        is_truly_new_org = existing_role_perms == 0 and (user_count is None or user_count <= 1)
        
        if is_truly_new_org:
            default_roles = ["admin", "editor", "viewer"]
            restricted_modules = {"classification", "role access", "role-access"}
            for module in modules:
                module_name = module['module']
                permissions = {r: "access" for r in default_roles}
                if module_name.lower() in restricted_modules:
                    permissions["editor"] = "none"
                    permissions["viewer"] = "none"
                matrix.append({
                    "section": module_name,
                    "permissions": permissions
                })
        else:
            for module in modules:
                module_name = module['module']
                permissions = {}
                for role in roles:
                    role_name = role['role']
                    has_access = role_permissions.get(role_name, {}).get(module_name, False)
                    permissions[role_name] = "access" if has_access else "none"
                # In established orgs, admin Settings may be immutable (always)
                if module_name == "Settings" and "admin" in permissions:
                    permissions["admin"] = "always"
                matrix.append({
                    "section": module_name,
                    "permissions": permissions
                })
        cursor.close()
        conn.close()
        logging.info(f"Retrieved role matrix with {len(matrix)} modules for organization {organization_id}")
        return matrix
        
    except Exception as e:
        logging.error(f"Error getting role matrix for organization {organization_id}: {e}")
        raise


async def update_role_matrix(organization_id: int, matrix_data: List[Dict[str, Any]]) -> bool:
    """
    Update role permissions based on matrix data
    """
    logging.info(f"Updating role matrix for organization_id={organization_id}")
    logging.info(f"Matrix data structure: {matrix_data}")
    
    # Validate matrix_data
    if not matrix_data or not isinstance(matrix_data, list):
        logging.error(f"Invalid matrix_data: expected list, got {type(matrix_data)}")
        return False
    
    try:
        conn = get_connection()
        if conn is None:
            logging.error("Failed to establish database connection")
            return False
        
        cursor = conn.cursor()
        
        # Get all permissions grouped by module
        cursor.execute("SELECT id, module FROM permissions ORDER BY module")
        permissions_by_module = {}
        for row in cursor.fetchall():
            module = row[1]
            if module not in permissions_by_module:
                permissions_by_module[module] = []
            permissions_by_module[module].append(row[0])
        
        # Get all roles in the organization
        cursor.execute("""
            SELECT DISTINCT role 
            FROM users 
            WHERE organization_id = %s AND status = 'active'
        """, (organization_id,))
        roles = [row[0] for row in cursor.fetchall()]
        
        # Update permissions for each role
        for role in roles:
            # Clear existing permissions for this role
            cursor.execute("DELETE FROM role_permissions WHERE role = %s", (role,))
            
            # Add new permissions based on matrix data
            for module_data in matrix_data:
                # Handle different data structures
                if 'section' in module_data:
                    module_name = module_data['section']
                elif 'module' in module_data:
                    module_name = module_data['module']
                else:
                    logging.error(f"Invalid module data structure: {module_data}")
                    continue
                
                permissions = module_data.get('permissions', {})
                
                if role in permissions:
                    permission_status = permissions[role]
                    
                   
                    if permission_status == "always":
                        continue
                    
                    # Get all permission IDs for this module
                    module_permission_ids = permissions_by_module.get(module_name, [])
                    
                    # Set access based on permission status
                    has_access = permission_status == "access"
                    
                    for perm_id in module_permission_ids:
                        cursor.execute("""
                            INSERT INTO role_permissions (role, permission_id, has_access)
                            VALUES (%s, %s, %s)
                        """, (role, perm_id, has_access))
        conn.commit()
        cursor.close()
        conn.close()
        logging.info(f"Successfully updated role matrix for organization {organization_id}")
        return True
        
    except KeyError as e:
        logging.error(f"Missing key in matrix data: {e}")
        logging.error(f"Matrix data structure: {matrix_data}")
        if conn:
            conn.rollback()
        return False
    except Exception as e:
        logging.error(f"Error updating role matrix for organization {organization_id}: {e}")
        logging.error(f"Matrix data structure: {matrix_data}")
        if conn:
            conn.rollback()
        return False

async def update_permission_by_module_role_optimized(module: str, role: str, has_access: bool, organization_id: int) -> bool:
    """
    OPTIMIZED: Update permission by module and role for a specific organization.
    Uses bulk operations and single query for better performance.
    """
    logging.info(f"Updating permission: module={module}, role={role}, has_access={has_access}, org_id={organization_id}")
    try:
        conn = get_connection()
        if conn is None:
            logging.error("Failed to establish database connection")
            return False
        
        cursor = conn.cursor()
        
        # Single query to get permission IDs and user IDs
        cursor.execute("""
            WITH permission_ids AS (
                SELECT id FROM permissions WHERE module = %s
            ),
            user_ids AS (
                SELECT id FROM users 
                WHERE organization_id = %s AND status = 'active' AND role = %s
            )
            SELECT 
                (SELECT array_agg(id) FROM permission_ids) as perm_ids,
                (SELECT array_agg(id) FROM user_ids) as user_ids
        """, (module, organization_id, role))
        
        result = cursor.fetchone()
        permission_ids = result[0] if result and result[0] else []
        user_ids = result[1] if result and result[1] else []
        
        if not permission_ids:
            logging.warning(f"No permissions found for module: {module}")
            return False
        
        if not user_ids:
            logging.info(f"No users with role={role} found in org_id={organization_id}; nothing to update")
            # Even if no users, we still want org policy persisted; continue

        # Ensure org-level defaults are seeded ONCE per org (full access) if missing
        cursor.execute("SELECT COUNT(*) FROM org_role_permissions WHERE organization_id = %s", (organization_id,))
        org_policy_count = cursor.fetchone()[0]
        if org_policy_count == 0:
            # Seed defaults for all roles in this org across all permissions
            # Default: full access, except editor/viewer have no access to classification/role-access
            cursor.execute("SELECT DISTINCT role FROM users WHERE organization_id = %s AND status = 'active'", (organization_id,))
            org_roles_rows = cursor.fetchall()
            org_roles = [r[0] if not isinstance(r, dict) else r['role'] for r in org_roles_rows] or [role]
            cursor.execute("SELECT id, module FROM permissions ORDER BY id")
            perms = cursor.fetchall()
            # Build seed rows with exceptions
            restricted_modules = {"classification", "role access", "role-access"}
            seed_rows = []
            for pr in perms:
                pid = pr[0] if not isinstance(pr, dict) else pr['id']
                mod = pr[1] if not isinstance(pr, dict) else pr['module']
                mod_l = (mod or "").lower()
                for rname in org_roles:
                    if rname in ("editor", "viewer") and mod_l in restricted_modules:
                        seed_rows.append((organization_id, rname, pid, False))
                    else:
                        seed_rows.append((organization_id, rname, pid, True))
            if seed_rows:
                from psycopg2.extras import execute_values
                execute_values(
                    cursor,
                    """
                    INSERT INTO org_role_permissions (organization_id, role, permission_id, has_access)
                    VALUES %s
                    ON CONFLICT (organization_id, role, permission_id)
                    DO UPDATE SET has_access = EXCLUDED.has_access
                    """,
                    seed_rows,
                    template=None,
                    page_size=5000
                )

        # 1) Persist role-level override for this organization
        from psycopg2.extras import execute_values
        org_role_rows = [(organization_id, role, perm_id, has_access) for perm_id in permission_ids]
        execute_values(
            cursor,
            """
            INSERT INTO org_role_permissions (organization_id, role, permission_id, has_access)
            VALUES %s
            ON CONFLICT (organization_id, role, permission_id)
            DO UPDATE SET has_access = EXCLUDED.has_access
            """,
            org_role_rows,
            template=None,
            page_size=1000
        )

        # 2) Also project to user_permissions for existing users for immediate effect
        insert_data = []
        for user_id in user_ids:
            for perm_id in permission_ids:
                insert_data.append((user_id, perm_id, has_access, organization_id))
        if insert_data:
            execute_values(
                cursor,
                """
                INSERT INTO user_permissions (user_id, permission_id, has_access, organization_id)
                VALUES %s
                ON CONFLICT (user_id, permission_id, organization_id)
                DO UPDATE SET has_access = EXCLUDED.has_access
                """,
                insert_data,
                template=None,
                page_size=1000
            )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logging.info(f"Successfully updated {len(insert_data)} user-permission rows for role={role}, module={module}, org_id={organization_id}")
        return True
        
    except Exception as e:
        logging.error(f"Error updating permission by module and role: {e}")
        if conn:
            conn.rollback()
        raise

async def update_permission_by_module_role(module: str, role: str, has_access: bool, organization_id: int) -> bool:
    """
    Update permission by module and role for a specific organization.
    Scopes changes to users within the provided organization_id by writing to user_permissions.
    This handles the exact request format: {module: 'Activity Log', role: 'viewer', has_access: true}
    """
    logging.info(
        f"Updating permission: module={module}, role={role}, has_access={has_access}, org_id={organization_id}"
    )
    try:
        conn = get_connection()
        if conn is None:
            logging.error("Failed to establish database connection")
            return False
        
        cursor = conn.cursor()
        
        # Get all permission IDs for this module
        cursor.execute("SELECT id FROM permissions WHERE module = %s", (module,))
        permission_ids = [row[0] for row in cursor.fetchall()]
        
        if not permission_ids:
            logging.warning(f"No permissions found for module: {module}")
            return False
        
        # Get all users in this organization with the specified role
        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE organization_id = %s AND status = 'active' AND role = %s
            """,
            (organization_id, role),
        )
        user_ids = [row[0] for row in cursor.fetchall()]

        if not user_ids:
            logging.info(
                f"No users with role={role} found in org_id={organization_id}; nothing to update"
            )
            conn.commit()
            cursor.close()
            conn.close()
            return True

        # Upsert user-specific permissions scoped to this organization
        updated_count = 0
        for user_id in user_ids:
            for perm_id in permission_ids:
                cursor.execute(
                    """
                    INSERT INTO user_permissions (user_id, permission_id, has_access, organization_id)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (user_id, permission_id, organization_id)
                    DO UPDATE SET has_access = EXCLUDED.has_access
                    """,
                    (user_id, perm_id, has_access, organization_id),
                )
                updated_count += 1
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logging.info(
            f"Successfully updated {updated_count} user-permission rows for role={role}, module={module}, org_id={organization_id}"
        )
        return True
        
    except Exception as e:
        logging.error(f"Error updating permission by module and role: {e}")
        if conn:
            conn.rollback()
        raise
