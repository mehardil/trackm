
from database import get_connection

def login():
    return None



def login(username, password):
    conn = get_connection()
    cursor = conn.cursor()
    sql = """
    SELECT * FROM users where username = %s and password = %s;
    """
    params = (username, password)
    try:
        cursor.execute(sql, params)
        rec = cursor.fetchone()
        if rec:
            print("Record fetched successfully.", rec)
            return True
        else:
            print("No matching record found.")
            return False
    except Exception as e:
        print(f"Failed to fetch record from database: {e}")
        return False
    finally:
        cursor.close()
        