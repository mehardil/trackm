"""
In this file we will make connection with PostgreSQL database
"""

import psycopg2
from psycopg2 import OperationalError
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def get_connection():
    db_config = {
        "host": os.getenv('DB_HOST', 'localhost'),
        "port": int(os.getenv('DB_PORT', 5432)),
        "user": os.getenv('DB_USER', 'postgres'),
        "password": os.getenv('DB_PASSWORD', 'Me##1234'),
        "dbname": os.getenv('DB_NAME', 'tracknew1')
    }

    try:
        conn = psycopg2.connect(**db_config)
        print("✅ Connected to PostgreSQL database successfully.")
        return conn
    except OperationalError as e:
        print(f"❌ Error connecting to the PostgreSQL database:\n{e}")
        return None
