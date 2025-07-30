import logging
from database import get_connection
import psycopg2
import psycopg2.extras
import jwt
SECRET_KEY = "mehardil123"

async def login(username, password):
    logging.info(f"Called login with username={username}")
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT * FROM users")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        if result:
            # Create JWT token
            token = jwt.encode({"user_id": result["id"], "username": result["username"]}, SECRET_KEY, algorithm="HS256")
            logging.info("login succeeded, JWT token created")
            return {"token": token, "user": result}
        else:
            logging.info("login failed: invalid credentials")
            return False
    except Exception as e:
        logging.error(f"login failed: {e}")
        return False
    finally:
        pass
