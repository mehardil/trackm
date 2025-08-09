#!/usr/bin/env python3
"""
Test script for organization login system
This script tests the signup and login functionality
"""

import sys
import os
import asyncio
import json

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from service.signup_service import create_organization, verify_organization_otp
from service.login_service import login

async def test_organization_login():
    """Test the complete organization signup and login flow"""
    
    print("🧪 Testing Organization Login System")
    print("=" * 50)
    
    # Test data for organization creation
    test_org_data = {
        "name": "Test Organization",
        "description": "A test organization for login testing",
        "contact_email": "test@example.com",
        "contact_phone": "1234567890",
        "logo_url": "https://example.com/logo.png",
        "password": "testpassword123",
        "settings": {"theme": "dark", "timezone": "UTC"}
    }
    
    try:
        print("1️⃣ Creating test organization...")
        result = create_organization(test_org_data)
        print(f"   ✅ Organization created: {result}")
        
        org_id = result['org_id']
        
        print("\n2️⃣ Testing login with correct credentials...")
        login_result = await login("Test Organization", "testpassword123")
        print(f"   ✅ Login result: {json.dumps(login_result, indent=2)}")
        
        print("\n3️⃣ Testing login with wrong password...")
        wrong_login = await login("Test Organization", "wrongpassword")
        print(f"   ❌ Wrong password result: {json.dumps(wrong_login, indent=2)}")
        
        print("\n4️⃣ Testing login with email instead of name...")
        email_login = await login("test@example.com", "testpassword123")
        print(f"   ✅ Email login result: {json.dumps(email_login, indent=2)}")
        
        print("\n5️⃣ Testing login with non-existent organization...")
        fake_login = await login("Fake Organization", "password")
        print(f"   ❌ Fake org result: {json.dumps(fake_login, indent=2)}")
        
        print("\n🎉 All tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

def test_password_hashing():
    """Test password hashing functionality"""
    print("\n🔐 Testing Password Hashing")
    print("=" * 30)
    
    from service.login_service import hash_password, verify_password
    
    test_password = "mypassword123"
    
    # Hash password
    hashed = hash_password(test_password)
    print(f"   Original password: {test_password}")
    print(f"   Hashed password: {hashed}")
    
    # Verify password
    is_valid = verify_password(test_password, hashed)
    print(f"   Password verification: {'✅ Valid' if is_valid else '❌ Invalid'}")
    
    # Test wrong password
    is_wrong = verify_password("wrongpassword", hashed)
    print(f"   Wrong password verification: {'❌ Should be invalid' if not is_wrong else '⚠️ Unexpectedly valid'}")

if __name__ == "__main__":
    print("🚀 Starting Organization Login System Tests")
    print("=" * 60)
    
    # Test password hashing
    test_password_hashing()
    
    # Test async login system
    print("\n" + "=" * 60)
    asyncio.run(test_organization_login())
    
    print("\n🏁 Testing completed!")
