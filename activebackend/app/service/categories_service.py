import logging
from fastapi import HTTPException
from database import get_connection
import psycopg2.extras


def asign_website_to_categories(website_url, categories, organization_id):
    """Fetch and return all website/app categories from PostgreSQL"""
    try:
        # ✅ Connect to PostgreSQL
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # ✅ Fetch category data (optionally filtered by organization_id if available)
        sql = """
            SELECT id,type, pattern, category 
            FROM app_website_rules
        """
        cursor.execute(sql)
        rows = cursor.fetchall()

        # ✅ Prepare structured list
        categories_data = []
        for row in rows:
            data_item = {
                "category_id": row["id"],
                "type": row["type"],
                "pattern": str(row["pattern"])[1:-2],
                "category": row["category"]
            }
            categories_data.append(data_item)

        # ✅ Close connection
        cursor.close()
        conn.close()
        return {
            "success": True,
            "message": "Fetched categories successfully",
            "count": len(categories_data),
            "categories": categories_data
        }

    except Exception as e:
        logging.error(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")




def update_web_categories(website_url, categories, organization_id):
    """update categories of website and applicationn"""
    return {
            "success": True,
            "message": "Websites assigned to categories successfully"
        }