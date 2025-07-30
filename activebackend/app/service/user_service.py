from database import get_connection
import psycopg2.extras
import logging

async def get_all_user(filter_type: str):
    logging.info(f"Called get_all_user with filter_type={filter_type}")
    try:
        # TODO:
        result = []  
        logging.info("get_all_user succeeded")
        return result
    except Exception as e:
        logging.error(f"get_all_user failed: {e}")
        raise
