from database import get_connection
from typing import Optional
import psycopg2
import psycopg2.extras

def check_user_organization(user_id: int, team_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT organization_id FROM teams WHERE id = %s", (team_id,))
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
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT organization_id FROM users WHERE id = %s", (data.owner_id,))
    user_organization = cursor.fetchone()
    if user_organization is None:
        cursor.close()
        conn.close()
        return {"error": "User not found."}
    if user_organization['organization_id'] != data.organization_id:
        cursor.close()
        conn.close()
        return {"error": "User does not have access to this organization."}
    query = """
        INSERT INTO teams (name, description, owner_id, organization_id)
        VALUES (%s, %s, %s, %s)
    """
    cursor.execute(query, (
        data.name,
        data.description,
        data.owner_id,
        data.organization_id
    ))
    conn.commit()
    team_id = cursor.lastrowid
    cursor.execute("SELECT * FROM teams WHERE id = %s", (team_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result


def get_team_by_id(team_id: int, user_id: int):
    org_check = check_user_organization(user_id, team_id)
    if isinstance(org_check, dict) and "error" in org_check:
        return org_check 
    conn = get_connection()
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


def get_all_teams(user_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    org_check = check_user_organization(user_id, None)
    if isinstance(org_check, dict) and "error" in org_check:
        return org_check  
    cursor.execute("SELECT * FROM teams WHERE organization_id = %s", (org_check,))
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results


def update_team(team_id: int, data, user_id: int):
    org_check = check_user_organization(user_id, team_id)
    if isinstance(org_check, dict) and "error" in org_check:
        return org_check  
    conn = get_connection()
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
    cursor = conn.cursor()
    query = "UPDATE users SET team_id = %s WHERE id = %s"
    cursor.execute(query, (team_id, user_id))
    conn.commit()
    cursor.close()
    conn.close()
    return True


def remove_user_from_team(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    query = "UPDATE users SET team_id = NULL WHERE id = %s"
    cursor.execute(query, (user_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return True


def get_activities_of_team(team_id: int):
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    query = """
        SELECT a.*, u.username 
        FROM activities a 
        INNER JOIN users u ON a.user_id = u.id 
        WHERE a.team_id = %s limit 600;
    """
    print(query)
    print(team_id)
    cursor.execute(query, (team_id,))
    activities = cursor.fetchall()
    # print(activities ,"this is activities logs")
    cursor.close()
    conn.close()
    return activities


















# def get_activities_of_team(team_id: int):
#     conn = get_connection()
#     cursor = conn.cursor(dictionary=True)  
#     query = "SELECT * FROM `activities` where team_id =%s"
#     query = "SELECT a.*, u.username FROM activities a INNER JOIN users u ON a.user_id = u.id WHERE a.team_id = %s;"
#     print(query)
#     cursor.execute(query, (team_id,))
#     activities = cursor.fetchall()  
    
#     cursor.close()
#     conn.close()
#     return activities


def get_activities_of_team_filter(
    team_id: int,
    date: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    duration: Optional[str] = None,
    report_type: Optional[str] = "Total"
):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    base_query = """
        SELECT a.*, u.username 
        FROM activities a 
        INNER JOIN users u ON a.user_id = u.id 
        WHERE a.team_id = %s
    """
    params = [team_id]

    # Optional filters
    if date:
        base_query += " AND DATE(a.start_time) = %s"
        params.append(date)

    if start_time and end_time:
        base_query += " AND TIME(a.start_time) >= %s AND TIME(a.end_time) <= %s"
        params.extend([start_time, end_time])
    print(base_query)
    cursor.execute(base_query, tuple(params))
    activities = cursor.fetchall()

    # # Optional post-processing for report_type or duration
    # if duration and "min" in duration:
    #     try:
    #         minutes = int(duration.replace("min", "").strip())
    #         seconds = minutes * 60
    #         activities = [a for a in activities if a["duration"] >= seconds]
    #     except ValueError:
    #         pass

    cursor.close()
    conn.close()
    return activities

    
