#!/usr/bin/env python3
"""
Test script for secure token approach
Shows the difference between minimal tokens and full data storage
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from service.login_service import login, get_user_details_from_token
import asyncio
import logging
import json

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

async def test_secure_tokens():
    """Test the secure token approach"""
    
    print("🔒 Testing Secure Token Approach")
    print("=" * 50)
    
    # Test 1: Login and get minimal token
    print("\n1️⃣ Testing Login with Minimal Token:")
    try:
        login_result = await login("Mehar Mehar Dil", "12345678")
        
        if login_result.get('success'):
            print("   ✅ Login successful!")
            
            # Show what's stored in JWT token (minimal)
            token = login_result.get('token')
            print(f"   🔑 JWT Token: {token[:50]}...")
            
            # Decode token to show minimal data
            import jwt
            from config import config
            try:
                payload = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM])
                print("   📋 Token contains only:")
                for key, value in payload.items():
                    if key != 'exp':
                        print(f"      - {key}: {value}")
                    else:
                        print(f"      - {key}: {value} (expiry)")
                
                print(f"   📏 Token size: {len(token)} characters")
                
            except Exception as e:
                print(f"   ❌ Error decoding token: {e}")
            
            # Show full user data (not in token)
            print("\n   👤 Full user data (stored on server, not in token):")
            user_data = login_result.get('user', {})
            print(f"      - Name: {user_data.get('name')}")
            print(f"      - Email: {user_data.get('email')}")
            print(f"      - Role: {user_data.get('role')}")
            print(f"      - Department: {user_data.get('department')}")
            print(f"      - Organization: {user_data.get('organization', {}).get('name')}")
            
        else:
            print(f"   ❌ Login failed: {login_result.get('message')}")
            
    except Exception as e:
        print(f"   ❌ Login error: {e}")
    
    # Test 2: Get user details from token
    print("\n2️⃣ Testing Get User Details from Token:")
    try:
        if login_result.get('success'):
            token = login_result.get('token')
            user_details = get_user_details_from_token(token)
            
            if user_details.get('success'):
                print("   ✅ User details retrieved from token!")
                user = user_details.get('user', {})
                print(f"      - Name: {user.get('name')}")
                print(f"      - Email: {user.get('email')}")
                print(f"      - Role: {user.get('role')}")
                print(f"      - Organization: {user.get('organization', {}).get('name')}")
            else:
                print(f"   ❌ Failed to get user details: {user_details.get('message')}")
        else:
            print("   ⚠️ Skipping user details test - login failed")
            
    except Exception as e:
        print(f"   ❌ User details error: {e}")
    
    # Test 3: Compare approaches
    print("\n3️⃣ Security Comparison:")
    print("   🔒 MINIMAL TOKEN APPROACH (Current):")
    print("      ✅ Small token size")
    print("      ✅ Minimal data exposure")
    print("      ✅ Secure - sensitive data on server")
    print("      ✅ Easy to invalidate")
    print("      ✅ Better performance")
    
    print("\n   🚨 FULL DATA IN TOKEN APPROACH (Previous):")
    print("      ❌ Large token size")
    print("      ❌ All data exposed in localStorage")
    print("      ❌ Security risk - data visible to anyone")
    print("      ❌ Harder to invalidate")
    print("      ❌ Performance impact")
    
    print("\n" + "=" * 50)
    print("🏁 Secure token test completed!")

if __name__ == "__main__":
    asyncio.run(test_secure_tokens())







