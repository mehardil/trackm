from database import get_connection
from typing import Optional
import psycopg2
import psycopg2.extras
from database_clickhouse import clickhouse_connection
import logging

def check_user_organization(user_id: int, team_id: int):
    conn = get_connection()
    if conn is None:
        return {"error": "Database connection failed."}
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT organization_id FROM groups WHERE id = %s", (team_id,))
    team = cursor.fetchone()
    if not team:
        cursor.close()
        conn.close()
        return {"error": "Team not found."}
    cursor.execute("SELECT organization_id FROM users WHERE id = %s", (user_id,))
    user_organization = cursor.fetchone()
    if not user_organization:
        cursor.close()
        conn.close()
        return {"error": "User not found."}
    if user_organization['organization_id'] != team['organization_id']:
        cursor.close()
        conn.close()
        return {"error": "User does not have access to this team."}
    cursor.close()
    conn.close()
    return user_organization['organization_id']







def create_team(data):
    try:
        conn = get_connection()
        if conn is None:
            return {"success": False, "message": "Database connection failed"}
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT organization_id FROM users WHERE id = %s", (data.get("user_id"),))
        user_organization = cursor.fetchone()
        if user_organization is None:
            return {"success": False, "message": "This organization does not exist"}
        # check creator role
        sql = "SELECT role FROM users WHERE id = %s"
        cursor.execute(sql, (data.get("user_id"),))
        creater_role = cursor.fetchone()
        if not creater_role or creater_role.get("role") != "admin":
            raise ValueError("Creator is not admin, unable to create new group")
        query = """
            INSERT INTO groups (name, description, organization_id)
            VALUES (%s, %s, %s)
            RETURNING id
        """
        cursor.execute(query, (data.get("team_name"), data.get("description"), data.get("org_id")))
        team_id = cursor.fetchone()["id"]
        conn.commit()

        # fetch newly created team
        cursor.execute("SELECT * FROM groups WHERE id = %s", (team_id,))
        result = cursor.fetchone()
        if result:
            return {
                "success": True,
                "message": "Team created successfully.",
                "team": result
            }
        else:
            return {
                "success": False,
                "message": "Team creation failed."
            }
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": f"Error creating team: {str(e)}"}
    finally:
        cursor.close()
        conn.close()





def get_all_teams(data):
    """list of teams"""
    conn = get_connection()
    if conn is None:
        return {"success": False, "message": "Database connection failed"}
    
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    user_id = data.get('user_id')
    org_id = data.get('org_id')
    cursor.execute("select * from groups where organization_id = %s", (org_id,))
    teams = cursor.fetchall()
    print(teams)
    cursor.close()
    conn.close()
    return {
    "success": True,
    "message": "Team listed successfully.",
    "teams": teams
    }
 





















    


def get_team_by_id(team_id: int, user_id: int):
    org_check = check_user_organization(user_id, team_id)
    if isinstance(org_check, dict) and "error" in org_check:
        return org_check
    conn = get_connection()
    if conn is None:
        return {"error": "Database connection failed."}
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM teams WHERE id = %s", (team_id,))
    team = cursor.fetchone()
    if not team:
        cursor.close()
        conn.close()
        return {"error": "Team not found."}
    cursor.close()
    conn.close()
    return team




def update_team(team_id: int, data, user_id: int):
    org_check = check_user_organization(user_id, team_id)
    if isinstance(org_check, dict) and "error" in org_check:
        return org_check
    conn = get_connection()
    if conn is None:
        return {"error": "Database connection failed."}
    
    cursor = conn.cursor(dictionary=True)
    updates = []
    values = []

    for field in ["name", "description", "owner_id", "organization_id"]:
        value = getattr(data, field, None)
        if value is not None:
            updates.append(f"{field} = %s")
            values.append(value)
    if not updates:
        cursor.close()
        conn.close()
        return {"error": "No fields to update."}
    values.append(team_id)
    sql = f"UPDATE teams SET {', '.join(updates)} WHERE id = %s"
    cursor.execute(sql, tuple(values))
    conn.commit()
    cursor.execute("SELECT * FROM teams WHERE id = %s", (team_id,))
    updated = cursor.fetchone()
    cursor.close()
    conn.close()
    return updated


def delete_team(team_id: int, user_id: int):
    org_check = check_user_organization(user_id, team_id)
    if isinstance(org_check, dict) and "error" in org_check:
        return org_check
    conn = get_connection()
    if conn is None:
        return {"error": "Database connection failed."}
    
    cursor = conn.cursor()
    cursor.execute("DELETE FROM teams WHERE id = %s", (team_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return True


def get_team_users(team_id: int, user_id: int):
    org_check = check_user_organization(user_id, team_id)
    if isinstance(org_check, dict) and "error" in org_check:
        return org_check
    conn = get_connection()
    if conn is None:
        return {"error": "Database connection failed."}
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE team_id = %s", (team_id,))
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    return users


def assign_user_to_team(user_id: int, team_id: int):
    org_check = check_user_organization(user_id, team_id)
    if isinstance(org_check, dict) and "error" in org_check:
        return org_check
    conn = get_connection()
    if conn is None:
        return {"error": "Database connection failed."}
    
    cursor = conn.cursor()
    query = "UPDATE users SET team_id = %s WHERE id = %s"
    cursor.execute(query, (team_id, user_id))
    conn.commit()
    cursor.close()
    conn.close()
    return True


def remove_user_from_team(user_id: int):
    conn = get_connection()
    if conn is None:
        return {"error": "Database connection failed."}
    
    cursor = conn.cursor()
    query = "UPDATE users SET team_id = NULL WHERE id = %s"
    cursor.execute(query, (user_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return True


async def get_activities_of_team(team_id: int):
    logging.info(f"Called get_activities_of_team with team_id={team_id}")
    try:
        # TODO: Replace with actual async DB call
        activities = []  # placeholder for async DB result
        logging.info("get_activities_of_team succeeded")
        return activities
    except Exception as e:
        logging.error(f"get_activities_of_team failed: {e}")
        raise


async def get_activities_of_team_filter(
    team_id: int,
    date: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    duration: Optional[str] = None,
    report_type: Optional[str] = "Total"
):
    logging.info(f"Called get_activities_of_team_filter with team_id={team_id}, date={date}, start_time={start_time}, end_time={end_time}, duration={duration}, report_type={report_type}")
    try:
        # TODO: Replace with actual async DB call
        activities = []  # placeholder for async DB result
        logging.info("get_activities_of_team_filter succeeded")
        return activities
    except Exception as e:
        logging.error(f"get_activities_of_team_filter failed: {e}")
        raise


def assign_users_to_team(team_id: int, user_emails: list, organization_id: int):
    """
    Assign multiple users to a team by their email addresses
    """
    try:
        conn = get_connection()
        if not conn:
            return {"success": False, "message": "Database connection failed"}
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # First verify the team exists and get its organization_id
        cursor.execute("SELECT organization_id FROM groups WHERE id = %s", (team_id,))
        team = cursor.fetchone()
        
        if not team:
            return {"success": False, "message": "Team not found"}
        
        if team['organization_id'] != organization_id:
            return {"success": False, "message": "Team does not belong to this organization"}
        
        # Get user IDs by email addresses
        placeholders = ','.join(['%s'] * len(user_emails))
        query = f"SELECT id, email FROM users WHERE email IN ({placeholders}) AND organization_id = %s"
        
        cursor.execute(query, user_emails + [organization_id])
        users = cursor.fetchall()
        
        if not users:
            return {"success": False, "message": "No users found with the provided emails in this organization"}
        
        # Check which users are already assigned to this team
        user_ids = [user['id'] for user in users]
        
        placeholders = ','.join(['%s'] * len(user_ids))
        cursor.execute(f"SELECT user_id FROM user_groups WHERE group_id = %s AND user_id IN ({placeholders})", 
                      [team_id] + user_ids)
        existing_assignments = cursor.fetchall()
        existing_user_ids = [assignment['user_id'] for assignment in existing_assignments]
        
        # Filter out users already assigned to this team
        new_user_ids = [user_id for user_id in user_ids if user_id not in existing_user_ids]
        
        if not new_user_ids:
            return {"success": False, "message": "All users are already assigned to this team"}
        
        # Insert new assignments
        for user_id in new_user_ids:
            cursor.execute("INSERT INTO user_groups (user_id, group_id, organization_id) VALUES (%s, %s, %s)",
                         (user_id, team_id, organization_id))
        
        conn.commit()
        
        # Get the newly assigned users with correct column names
        placeholders = ','.join(['%s'] * len(new_user_ids))
        cursor.execute(f"""
            SELECT 
                id, 
                email, 
                name,
                role
            FROM users WHERE id IN ({placeholders})
        """, new_user_ids)
        assigned_users = cursor.fetchall()
        
        result = {
            "success": True,
            "message": f"Successfully assigned {len(new_user_ids)} users to team",
            "assigned_users": assigned_users,
            "team_id": team_id
        }
        return result
        
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
        return {"success": False, "message": f"Error assigning users to team: {str(e)}"}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()


def get_team_members(team_id: int, organization_id: int):
    """
    Get all users assigned to a specific team
    """
    try:
        conn = get_connection()
        if conn is None:
            return {"success": False, "message": "Database connection failed"}
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Verify the team exists and belongs to the organization
        cursor.execute("SELECT organization_id FROM groups WHERE id = %s", (team_id,))
        team = cursor.fetchone()
        if not team:
            return {"success": False, "message": "Team not found"}
        
        if team['organization_id'] != organization_id:
            return {"success": False, "message": "Team does not belong to this organization"}
        
        # Get all users assigned to this team with correct column names
        cursor.execute("""
            SELECT 
                u.id, 
                u.email, 
                u.name,
                u.role,
                ug.group_id as team_id
            FROM users u
            INNER JOIN user_groups ug ON u.id = ug.user_id
            WHERE ug.group_id = %s AND ug.organization_id = %s
            ORDER BY u.name
        """, (team_id, organization_id))
        
        team_members = cursor.fetchall()
        
        return {
            "success": True,
            "message": f"Found {len(team_members)} team members",
            "team_id": team_id,
            "members": team_members
        }
        
    except Exception as e:
        return {"success": False, "message": f"Error getting team members: {str(e)}"}
    finally:
        cursor.close()
        conn.close()


def remove_users_from_team(team_id: int, user_emails: list, organization_id: int):
    """
    Remove users from a team by their email addresses
    """
    try:
        conn = get_connection()
        if conn is None:
            return {"success": False, "message": "Database connection failed"}
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # First verify the team exists and get its organization_id
        cursor.execute("SELECT organization_id FROM groups WHERE id = %s", (team_id,))
        team = cursor.fetchone()
        if not team:
            return {"success": False, "message": "Team not found"}
        
        if team['organization_id'] != organization_id:
            return {"success": False, "message": "Team does not belong to this organization"}
        
        # Get user IDs by email addresses
        placeholders = ','.join(['%s'] * len(user_emails))
        cursor.execute(f"SELECT id, email FROM users WHERE email IN ({placeholders}) AND organization_id = %s", 
                      user_emails + [organization_id])
        users = cursor.fetchall()
        
        if not users:
            return {"success": False, "message": "No users found with the provided emails in this organization"}
        
        user_ids = [user['id'] for user in users]
        
        # Remove users from the team
        placeholders = ','.join(['%s'] * len(user_ids))
        cursor.execute(f"DELETE FROM user_groups WHERE group_id = %s AND user_id IN ({placeholders}) AND organization_id = %s",
                      [team_id] + user_ids + [organization_id])
        
        removed_count = cursor.rowcount
        conn.commit()
        
        if removed_count == 0:
            return {"success": False, "message": "No users were assigned to this team"}
        
        return {
            "success": True,
            "message": f"Successfully removed {removed_count} users from team",
            "removed_count": removed_count,
            "team_id": team_id
        }
        
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": f"Error removing users from team: {str(e)}"}
    finally:
        cursor.close()
        conn.close()


def get_teams_with_member_counts(organization_id: int):
    """
    Get all teams with their member counts for an organization
    """
    try:
        conn = get_connection()
        if conn is None:
            return {"success": False, "message": "Database connection failed"}
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Get teams with member counts
        cursor.execute("""
            SELECT 
                g.id,
                g.name,
                g.description,
                g.organization_id,
                COUNT(ug.user_id) as member_count
            FROM groups g
            LEFT JOIN user_groups ug ON g.id = ug.group_id AND g.organization_id = ug.organization_id
            WHERE g.organization_id = %s
            GROUP BY g.id, g.name, g.description, g.organization_id
            ORDER BY g.name
        """, (organization_id,))
        
        teams = cursor.fetchall()
        
        return {
            "success": True,
            "message": f"Found {len(teams)} teams",
            "teams": teams
        }
        
    except Exception as e:
        return {"success": False, "message": f"Error getting teams with member counts: {str(e)}"}
    finally:
        cursor.close()
        conn.close()

    
