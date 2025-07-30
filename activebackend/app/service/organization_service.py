from database import get_connection
import psycopg2
import psycopg2.extras
import logging


async def get_organization_by_id(organization_id: int):
    logging.info(f"Called get_organization_by_id with organization_id={organization_id}")
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT * FROM organizations WHERE id = %s", (organization_id,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        logging.info("get_organization_by_id succeeded")
        return result
    except Exception as e:
        logging.error(f"get_organization_by_id failed: {e}")
        raise

