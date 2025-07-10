
# """in this file we will make connection with database"""
# import os
# from dotenv import load_dotenv
# import mysql.connector
# load_dotenv()
# def get_connection():
#     db_config = {
#         "host": os.getenv("DB_HOST"),
#         "user": os.getenv("DB_USER"),
#         "password": os.getenv("DB_PASSWORD"),
#         "database": os.getenv("DB_NAME")
#     }
#     conn = mysql.connector.connect(**db_config)
#     if conn.is_connected():
#         print("Connected to the database successfully")
#     return conn



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
        "dbname": 'trackmain'
    }

    try:
        conn = psycopg2.connect(**db_config)
        print("✅ Connected to PostgreSQL database successfully.")
        return conn
    except OperationalError as e:
        print(f"❌ Error connecting to the PostgreSQL database:\n{e}")
        return None
