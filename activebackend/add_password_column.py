#!/usr/bin/env python3
"""
Script to add password_hash column to organizations table
Run this script once to add the password_hash column for organization authentication
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from database import get_connection
import psycopg2
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def add_password_hash_column():
    """Add password_hash column to organizations table if it doesn't exist"""
    try:
        with get_connection() as conn:
            if not conn:
                logging.error("❌ Failed to connect to database")
                return False
                
            with conn.cursor() as cursor:
                # Check if password_hash column exists
                cursor.execute("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'organizations' AND column_name = 'password_hash'
                """)
                
                if not cursor.fetchone():
                    # Add password_hash column if it doesn't exist
                    cursor.execute("""
                        ALTER TABLE organizations 
                        ADD COLUMN password_hash VARCHAR(255)
                    """)
                    conn.commit()
                    logging.info("✅ Successfully added password_hash column to organizations table")
                    return True
                else:
                    logging.info("ℹ️ password_hash column already exists in organizations table")
                    return True
                    
    except Exception as e:
        logging.error(f"❌ Error adding password_hash column: {e}")
        return False

def check_organizations_table():
    """Check if organizations table exists and show its structure"""
    try:
        with get_connection() as conn:
            if not conn:
                logging.error("❌ Failed to connect to database")
                return False
                
            with conn.cursor() as cursor:
                # Check if organizations table exists
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_name = 'organizations'
                """)
                
                if not cursor.fetchone():
                    logging.error("❌ Organizations table does not exist!")
                    return False
                
                # Show table structure
                cursor.execute("""
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns 
                    WHERE table_name = 'organizations'
                    ORDER BY ordinal_position
                """)
                
                columns = cursor.fetchall()
                logging.info("📋 Organizations table structure:")
                for col in columns:
                    logging.info(f"   - {col[0]}: {col[1]} (nullable: {col[2]})")
                
                return True
                    
    except Exception as e:
        logging.error(f"❌ Error checking organizations table: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Checking organizations table structure...")
    if not check_organizations_table():
        print("❌ Failed to check organizations table")
        sys.exit(1)
    
    print("\n🔧 Adding password_hash column to organizations table...")
    if add_password_hash_column():
        print("✅ Successfully updated organizations table!")
        
        print("\n📋 Final table structure:")
        check_organizations_table()
    else:
        print("❌ Failed to update organizations table")
        sys.exit(1)
