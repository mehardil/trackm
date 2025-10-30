#!/usr/bin/env python3
"""
Direct database query to show all modules from permissions table
This bypasses the API and directly queries the database
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import get_connection
import psycopg2.extras

def show_all_modules():
    """Show all modules from the permissions table"""
    print("🔍 Direct Database Query: SELECT module FROM permissions")
    print("=" * 60)
    
    try:
        # Get database connection
        conn = get_connection()
        if conn is None:
            print("❌ Failed to connect to database")
            return False
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Query 1: Get all modules
        print("1. All modules from permissions table:")
        print("   SQL: SELECT DISTINCT module FROM permissions ORDER BY module;")
        print("   " + "-" * 50)
        
        cursor.execute("SELECT DISTINCT module FROM permissions ORDER BY module")
        modules = cursor.fetchall()
        
        print(f"   Found {len(modules)} unique modules:")
        for i, module in enumerate(modules, 1):
            print(f"   {i:2d}. {module['module']}")
        
        # Query 2: Get all permissions with modules
        print(f"\n2. All permissions with their modules:")
        print("   SQL: SELECT id, code, module FROM permissions ORDER BY module, id;")
        print("   " + "-" * 50)
        
        cursor.execute("SELECT id, code, module FROM permissions ORDER BY module, id")
        permissions = cursor.fetchall()
        
        print(f"   Found {len(permissions)} total permissions:")
        
        # Group by module
        current_module = None
        for perm in permissions:
            if perm['module'] != current_module:
                current_module = perm['module']
                print(f"\n   📁 {current_module}:")
            print(f"      - ID: {perm['id']:2d}, Code: {perm['code']}")
        
        # Query 3: Count permissions per module
        print(f"\n3. Permission count per module:")
        print("   SQL: SELECT module, COUNT(*) as count FROM permissions GROUP BY module ORDER BY count DESC;")
        print("   " + "-" * 50)
        
        cursor.execute("""
            SELECT module, COUNT(*) as count 
            FROM permissions 
            GROUP BY module 
            ORDER BY count DESC, module
        """)
        counts = cursor.fetchall()
        
        for count in counts:
            print(f"   {count['module']:20s}: {count['count']:2d} permissions")
        
        # Query 4: Get specific modules
        print(f"\n4. Permissions for specific modules:")
        print("   SQL: SELECT * FROM permissions WHERE module IN ('Dashboard', 'Teams', 'Insights');")
        print("   " + "-" * 50)
        
        cursor.execute("""
            SELECT id, code, module 
            FROM permissions 
            WHERE module IN ('Dashboard', 'Teams', 'Insights') 
            ORDER BY module, id
        """)
        specific_perms = cursor.fetchall()
        
        print(f"   Found {len(specific_perms)} permissions for Dashboard, Teams, and Insights:")
        for perm in specific_perms:
            print(f"   - {perm['module']:10s}: {perm['code']} (ID: {perm['id']})")
        
        cursor.close()
        conn.close()
        
        print(f"\n✅ Database queries completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error querying database: {e}")
        return False

def show_sql_queries():
    """Show the SQL queries that can be used"""
    print("\n" + "=" * 60)
    print("📝 SQL Queries for Permissions Modules")
    print("=" * 60)
    
    queries = [
        {
            "title": "Get all unique modules",
            "sql": "SELECT DISTINCT module FROM permissions ORDER BY module;"
        },
        {
            "title": "Get all permissions with modules",
            "sql": "SELECT id, code, module FROM permissions ORDER BY module, id;"
        },
        {
            "title": "Count permissions per module",
            "sql": """
            SELECT 
                module, 
                COUNT(*) as permission_count 
            FROM permissions 
            GROUP BY module 
            ORDER BY permission_count DESC, module;
            """
        },
        {
            "title": "Get permissions for specific modules",
            "sql": """
            SELECT id, code, module 
            FROM permissions 
            WHERE module IN ('Dashboard', 'Teams', 'Insights') 
            ORDER BY module, id;
            """
        },
        {
            "title": "Get modules with permission codes",
            "sql": """
            SELECT 
                module,
                STRING_AGG(code, ', ' ORDER BY code) as codes
            FROM permissions 
            GROUP BY module 
            ORDER BY module;
            """
        }
    ]
    
    for i, query in enumerate(queries, 1):
        print(f"\n{i}. {query['title']}:")
        print("   " + "-" * 40)
        print(f"   {query['sql']}")

if __name__ == "__main__":
    print("🚀 Permissions Modules - Direct Database Access")
    print("=" * 60)
    
    # Show SQL queries first
    show_sql_queries()
    
    # Try to connect to database and show data
    print("\n" + "=" * 60)
    print("📊 Live Database Data")
    print("=" * 60)
    
    success = show_all_modules()
    
    if not success:
        print("\n💡 Make sure:")
        print("   - Database is running and accessible")
        print("   - Database credentials are correct in .env file")
        print("   - Permissions table exists")
        print("   - You have the required database permissions")

