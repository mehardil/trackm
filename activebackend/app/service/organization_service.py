from database import get_connection
import json

def create_organization(data):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    query = """
        INSERT INTO organizations (name, description, contact_email, contact_phone, logo_url, is_active, settings)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(query, (
        data.name,
        data.description,
        data.contact_email,
        data.contact_phone,
        data.logo_url,
        data.is_active,
        json.dumps(data.settings)
    ))
    conn.commit()
    org_id = cursor.lastrowid
    cursor.execute("SELECT * FROM organizations WHERE id = %s", (org_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result

def get_all_organizations():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM organizations")
    results = cursor.fetchall()
    print(results)
    cursor.close()
    conn.close()
    return results

def get_organization_by_id(organization_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM organizations WHERE id = %s", (organization_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result

def update_organization(organization_id: int, data):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    # Build dynamic SQL
    updates = []
    values = []
    for field in ["name", "description", "contact_email", "contact_phone", "logo_url", "is_active", "settings"]:
        value = getattr(data, field, None)
        if value is not None:
            updates.append(f"{field} = %s")
            if field == "settings":
                values.append(json.dumps(value))
            else:
                values.append(value)
    if not updates:
        return None
    values.append(organization_id)
    sql = f"UPDATE organizations SET {', '.join(updates)} WHERE id = %s"
    cursor.execute(sql, tuple(values))
    conn.commit()
    cursor.execute("SELECT * FROM organizations WHERE id = %s", (organization_id,))
    updated = cursor.fetchone()
    cursor.close()
    conn.close()
    return updated
