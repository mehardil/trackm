#!/usr/bin/env python3
"""
Script to show all modules from permissions table
This demonstrates how to get permission modules through the API
"""

import requests
import json
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Base URL for the API
BASE_URL = "http://127.0.0.1:8000"

def get_permissions_modules():
    """Get all permissions and show their modules"""
    print("🔍 Getting all permissions and modules")
    print("=" * 50)
    
    # First, we need to login to get a token
    print("1. Logging in to get authentication token...")
    login_data = {
        "email": "admin@example.com",  # Replace with actual admin email
        "password": "password123"      # Replace with actual password
    }
    
    try:
        login_response = requests.post(f"{BASE_URL}/login/login/", json=login_data)
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.text}")
            return False
        
        login_result = login_response.json()
        if not login_result.get("success"):
            print(f"❌ Login failed: {login_result.get('message')}")
            return False
        
        token = login_result.get("token")
        user_info = login_result.get("user")
        
        print(f"✅ Login successful! User: {user_info.get('name')}, Role: {user_info.get('role')}")
        
        # Set up headers for authenticated requests
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Get all permissions
        print("\n2. Getting all permissions...")
        try:
            response = requests.get(f"{BASE_URL}/access/role-access/permissions", headers=headers)
            if response.status_code == 200:
                permissions = response.json()
                print(f"✅ Found {len(permissions)} permissions")
                
                # Group by module
                modules = {}
                for perm in permissions:
                    module = perm['module']
                    if module not in modules:
                        modules[module] = []
                    modules[module].append({
                        'id': perm['id'],
                        'code': perm['code']
                    })
                
                print("\n📋 All Modules and their Permissions:")
                print("=" * 40)
                for module, perms in modules.items():
                    print(f"\n🔹 {module}:")
                    for perm in perms:
                        print(f"   - ID: {perm['id']}, Code: {perm['code']}")
                
                print(f"\n📊 Summary:")
                print(f"   Total Modules: {len(modules)}")
                print(f"   Total Permissions: {len(permissions)}")
                
                # Show unique modules only
                print(f"\n📝 Unique Modules:")
                for i, module in enumerate(sorted(modules.keys()), 1):
                    print(f"   {i}. {module}")
                
                return True
                
            else:
                print(f"❌ Failed to get permissions: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error getting permissions: {e}")
            return False
        
    except Exception as e:
        print(f"❌ Error during login: {e}")
        return False

def show_sql_equivalent():
    """Show the SQL equivalent of what we're doing"""
    print("\n" + "=" * 50)
    print("🔍 SQL Equivalent")
    print("=" * 50)
    
    sql_queries = [
        {
            "title": "Get all modules from permissions",
            "query": "SELECT DISTINCT module FROM permissions ORDER BY module;"
        },
        {
            "title": "Get all permissions with modules",
            "query": "SELECT id, code, module FROM permissions ORDER BY module, id;"
        },
        {
            "title": "Count permissions per module",
            "query": """
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
            "query": """
            SELECT id, code, module 
            FROM permissions 
            WHERE module IN ('Dashboard', 'Teams', 'Insights') 
            ORDER BY module, id;
            """
        }
    ]
    
    for i, sql_info in enumerate(sql_queries, 1):
        print(f"\n{i}. {sql_info['title']}:")
        print("   SQL Query:")
        print(f"   {sql_info['query']}")
        print("   API Equivalent:")
        if i == 1:
            print("   GET /access/role-access/permissions (then filter by module)")
        elif i == 2:
            print("   GET /access/role-access/permissions")
        elif i == 3:
            print("   GET /access/role-access/permissions (then group by module)")
        elif i == 4:
            print("   GET /access/role-access/permissions (then filter by module)")

def show_curl_examples():
    """Show cURL examples for getting permissions"""
    print("\n" + "=" * 50)
    print("🌐 cURL Examples")
    print("=" * 50)
    
    print("1. Get all permissions (shows all modules):")
    print("""
curl -X GET \\
  -H "Authorization: Bearer <YOUR_TOKEN>" \\
  -H "Content-Type: application/json" \\
  "http://127.0.0.1:8000/access/role-access/permissions"
    """)
    
    print("\n2. Get permissions for a specific organization:")
    print("""
curl -X GET \\
  -H "Authorization: Bearer <YOUR_TOKEN>" \\
  -H "Content-Type: application/json" \\
  "http://127.0.0.1:8000/access/role-access/organization/50"
    """)
    
    print("\n3. Get role access summary (groups by role and shows modules):")
    print("""
curl -X GET \\
  -H "Authorization: Bearer <YOUR_TOKEN>" \\
  -H "Content-Type: application/json" \\
  "http://127.0.0.1:8000/access/role-access/summary/50"
    """)

if __name__ == "__main__":
    print("🚀 Permissions Modules Explorer")
    print("=" * 50)
    
    # Show SQL equivalent first
    show_sql_equivalent()
    
    # Show cURL examples
    show_curl_examples()
    
    # Try to get actual data (requires running server)
    print("\n" + "=" * 50)
    print("📊 Live Data (requires running server)")
    print("=" * 50)
    print("Note: Make sure the FastAPI server is running on http://127.0.0.1:8000")
    print("You can start it with: python -m uvicorn app.main:app --reload")
    print("=" * 50)
    
    # Uncomment the line below to test with live server
    # get_permissions_modules()

