#!/usr/bin/env python3
"""
Test script for database login system
Tests with actual database structure and users
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from service.login_service import login, search_user_by_field, get_users_in_organization
import asyncio
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

async def test_database_login():
    """Test the login system with actual database data"""
    
    print("🧪 Testing Database Login System")
    print("=" * 50)
    
    # Test 1: Login with existing user 'farhan akram'
    print("\n1️⃣ Testing Login with 'farhan akram':")
    try:
        login_result = await login("farhan akram", "Me##1234")
        
        if login_result.get('success'):
            print("   ✅ Login successful!")
            print(f"   User ID: {login_result.get('user', {}).get('id')}")
            print(f"   Username: {login_result.get('user', {}).get('username')}")
            print(f"   Organization: {login_result.get('user', {}).get('organization', {}).get('name')}")
            print(f"   Role: {login_result.get('user', {}).get('role')}")
        else:
            print(f"   ❌ Login failed: {login_result.get('message')}")
            
    except Exception as e:
        print(f"   ❌ Login error: {e}")
    
    # Test 2: Search user by name
    print("\n2️⃣ Testing User Search by Name:")
    try:
        search_result = search_user_by_field("farhan akram", "name")
        if search_result.get('success'):
            print("   ✅ User found by name!")
            print(f"   Username: {search_result['user']['username']}")
            print(f"   Email: {search_result['user']['email']}")
        else:
            print(f"   ❌ User search failed: {search_result.get('message')}")
    except Exception as e:
        print(f"   ❌ Search error: {e}")
    
    # Test 3: Search user by username
    print("\n3️⃣ Testing User Search by Username:")
    try:
        search_result = search_user_by_field("eee", "username")
        if search_result.get('success'):
            print("   ✅ User found by username!")
            print(f"   Name: {search_result['user']['name']}")
            print(f"   Email: {search_result['user']['email']}")
        else:
            print(f"   ❌ User search failed: {search_result.get('message')}")
    except Exception as e:
        print(f"   ❌ Search error: {e}")
    
    # Test 4: Search user by email
    print("\n4️⃣ Testing User Search by Email:")
    try:
        search_result = search_user_by_field("eee@gmail.com", "email")
        if search_result.get('success'):
            print("   ✅ User found by email!")
            print(f"   Name: {search_result['user']['name']}")
            print(f"   Username: {search_result['user']['username']}")
        else:
            print(f"   ❌ User search failed: {search_result.get('message')}")
    except Exception as e:
        print(f"   ❌ Search error: {e}")
    
    # Test 5: Get users in organization
    print("\n5️⃣ Testing Get Users in Organization:")
    try:
        org_users = get_users_in_organization(8)  # Organization ID 8
        if org_users.get('success'):
            print(f"   ✅ Found {len(org_users['users'])} users in organization {org_users['organization_id']}")
            for user in org_users['users']:
                print(f"      - {user['name']} ({user['username']}) - {user['role']}")
        else:
            print(f"   ❌ Failed to get organization users: {org_users.get('message')}")
    except Exception as e:
        print(f"   ❌ Organization users error: {e}")
    
    # Test 6: Try to login with non-existent user
    print("\n6️⃣ Testing Login with Non-existent User:")
    try:
        login_result = await login("Non Existent User", "password123")
        if login_result.get('success'):
            print("   ❌ Login should have failed!")
        else:
            print(f"   ✅ Login correctly failed: {login_result.get('message')}")
    except Exception as e:
        print(f"   ❌ Login error: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Database login test completed!")

if __name__ == "__main__":
    asyncio.run(test_database_login())







