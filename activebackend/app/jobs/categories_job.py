import logging
from fastapi import HTTPException
from database_clickhouse import clickhouse_connection
from database import get_connection
import psycopg2.extras


def get_lasted_categories(website_url, categories, organization_id):
    """Assign websites from ClickHouse to PostgreSQL with default category 'uncategorized'"""
    try:
        # ✅ Connect to Postgres
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # ✅ Connect to ClickHouse
        client = clickhouse_connection()
        
        query = "SELECT  FROM activities"
        result = client.query(query)
        websites = []
        for row in result.result_rows:
            # Handle cases safely
            if len(row) == 2:
                app, site = row
            elif len(row) == 1:
                app = row[0]
                site = None
            else:
                logging.warning(f"Unexpected row format: {row}")
                continue
            # Build final pattern
            pattern = site if site else app
            websites.append(pattern)
            # Insert into Postgres with category 'uncategorized'
            cursor.execute("""
                INSERT INTO app_website_rules (organization_id, type, pattern, category, description)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (organization_id, type, pattern) DO NOTHING
            """, (organization_id, 'website', pattern, 'uncategorized', f"Auto-added from {app}"))

        conn.commit()
        cursor.close()
        conn.close()
        return {
            "success": True,
            "message": "Websites assigned to categories successfully",
            "count": len(websites),
            "websites": websites
        }

    except Exception as e:
        logging.error(f"Error assigning websites: {e}")
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")



def update_web_categories(website_url, categories, organization_id):
    """update categories of website and applicationn"""
    return {
            "success": True,
            "message": "Websites assigned to categories successfully"
        }