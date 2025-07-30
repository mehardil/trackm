"""
In this file we will make connection with PostgreSQL database
"""

import psycopg2
from psycopg2 import OperationalError

def get_connection():
    db_config = {
        "host": 'localhost',
        "port": 5432,  # custom PostgreSQL port
        "user": 'postgres',
        "password": 'Me##1234', 
        "dbname": 'tracknew1'
    }

    try:
        conn = psycopg2.connect(**db_config)
        print("✅ Connected to PostgreSQL database successfully.")
        return conn
    except OperationalError as e:
        print(f"❌ Error connecting to the PostgreSQL database:\n{e}")
        return None
