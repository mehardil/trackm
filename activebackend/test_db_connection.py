#!/usr/bin/env python3
"""
Simple test script to check database connection
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import get_connection
import psycopg2

def test_db_connection():
    """Test the database connection"""
    print("🧪 Testing Database Connection")
    print("=" * 50)
    
    try:
        print("Attempting to connect to database...")
        conn = get_connection()
        
        if conn is None:
            print("❌ Database connection failed - get_connection() returned None")
            return False
        
        print("✅ Database connection successful!")
        
        # Test a simple query
        cursor = conn.cursor()
        cursor.execute("SELECT version()")
        version = cursor.fetchone()
        print(f"✅ Database version: {version[0]}")
        
        cursor.close()
        conn.close()
        print("✅ Connection closed successfully")
        return True
        
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False

if __name__ == "__main__":
    test_db_connection()









