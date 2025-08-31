#!/usr/bin/env python3
"""
Simple test script for user login system
Tests login without password hashing
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from service.login_service import login, check_username_availability, get_user_login_info
import asyncio
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

async def test_simple_login():
    """Test the simple login system"""
    
    print("🧪 Testing Simple Login System")
    print("=" * 50)
    
    # Test 1: User Login
    print("\n1️⃣ Testing User Login:")
    print("   Attempting login with username: 'Mehar Mehar Dil'")
    
    try:
        login_result = await login("Mehar Mehar Dil", "12345678")
        
        if login_result.get('success'):
            print("   ✅ Login successful!")
            print(f"   Token: {login_result.get('token')[:50]}...")
            print(f"   User: {login_result.get('user', {}).get('name')}")
            print(f"   Organization: {login_result.get('user', {}).get('organization', {}).get('name')}")
            print(f"   Username in other orgs: {login_result.get('user', {}).get('username_in_other_orgs')}")
            
            # Test 2: Check Username Availability
            print("\n2️⃣ Testing Username Availability Check:")
            username = login_result.get('user', {}).get('username')
            if username:
                availability = check_username_availability(username)
                print(f"   Username: {username}")
                print(f"   Exists in other orgs: {availability['exists_in_other_orgs']}")
                if availability['organizations']:
                    print(f"   Organizations: {[org['org_name'] for org in availability['organizations']]}")
                else:
                    print("   No conflicts found")
            
            # Test 3: Get User Info
            print("\n3️⃣ Testing Get User Info:")
            user_id = login_result.get('user', {}).get('id')
            if user_id:
                user_info = get_user_login_info(user_id)
                if user_info.get('success'):
                    print("   ✅ User info retrieved successfully!")
                    print(f"   Last active: {user_info['user']['last_active']}")
                else:
                    print(f"   ❌ Failed to get user info: {user_info.get('message')}")
                
        else:
            print(f"   ❌ Login failed: {login_result.get('message')}")
            
    except Exception as e:
        print(f"   ❌ Login error: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")

if __name__ == "__main__":
    asyncio.run(test_simple_login())







