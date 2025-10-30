#!/usr/bin/env python3
"""
Python test script for Role Access API
This script tests the API endpoints with demo data
"""

import requests
import json
import sys

# Base URL
BASE_URL = "http://127.0.0.1:8000"

# Demo data
DEMO_TOKEN = "your-jwt-token-here"  # Replace with actual token
DEMO_ORG_ID = 50
DEMO_USER_ID = 121

def test_api_connection():
    """Test if the API server is running"""
    print("🔍 Testing API Connection")
    print("=" * 30)
    
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✅ Server is running")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Server returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server")
        print("   Make sure your FastAPI server is running on http://127.0.0.1:8000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_endpoints_without_auth():
    """Test endpoints without authentication (should return 401)"""
    print("\n🔐 Testing Endpoints Without Authentication")
    print("=" * 45)
    
    endpoints = [
        "/access/role-access/permissions",
        "/access/role-matrix/50",
        "/access/user-permission-matrix/50",
        "/access/role-access/organization/50"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}")
            if response.status_code == 401:
                print(f"✅ {endpoint} - Authentication required (401)")
            elif response.status_code == 404:
                print(f"❌ {endpoint} - Not found (404)")
            else:
                print(f"⚠️  {endpoint} - Unexpected status {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")

def test_with_demo_token():
    """Test endpoints with demo token"""
    print("\n🧪 Testing With Demo Token")
    print("=" * 30)
    
    if DEMO_TOKEN == "your-jwt-token-here":
        print("⚠️  Please replace DEMO_TOKEN with your actual JWT token")
        print("   You can get a token by logging in to your system")
        return
    
    headers = {
        "Authorization": f"Bearer {DEMO_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Test getting permissions
    try:
        response = requests.get(f"{BASE_URL}/access/role-access/permissions", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Permissions endpoint - Found {len(data)} permissions")
        else:
            print(f"❌ Permissions endpoint - Status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Permissions endpoint - Error: {e}")
    
    # Test getting role matrix
    try:
        response = requests.get(f"{BASE_URL}/access/role-matrix/{DEMO_ORG_ID}", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Role matrix endpoint - Success: {data.get('success', False)}")
        else:
            print(f"❌ Role matrix endpoint - Status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Role matrix endpoint - Error: {e}")
    
    # Test getting user permission matrix
    try:
        response = requests.get(f"{BASE_URL}/access/user-permission-matrix/{DEMO_ORG_ID}", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ User permission matrix endpoint - Success: {data.get('success', False)}")
        else:
            print(f"❌ User permission matrix endpoint - Status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ User permission matrix endpoint - Error: {e}")

def test_update_permission():
    """Test updating a permission"""
    print("\n🔄 Testing Permission Update")
    print("=" * 30)
    
    if DEMO_TOKEN == "your-jwt-token-here":
        print("⚠️  Please replace DEMO_TOKEN with your actual JWT token")
        return
    
    headers = {
        "Authorization": f"Bearer {DEMO_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Test updating role permission
    try:
        data = {
            "module": "Teams",
            "role": "editor",
            "has_access": True
        }
        response = requests.patch(
            f"{BASE_URL}/access/role-matrix/{DEMO_ORG_ID}/permission",
            headers=headers,
            json=data
        )
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Role permission update - Success: {result.get('success', False)}")
        else:
            print(f"❌ Role permission update - Status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Role permission update - Error: {e}")
    
    # Test updating user permission
    try:
        data = {
            "user_id": DEMO_USER_ID,
            "permission_id": 1,
            "has_access": True
        }
        response = requests.patch(
            f"{BASE_URL}/access/user-permission-matrix/{DEMO_ORG_ID}/permission",
            headers=headers,
            json=data
        )
        if response.status_code == 200:
            result = response.json()
            print(f"✅ User permission update - Success: {result.get('success', False)}")
        else:
            print(f"❌ User permission update - Status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ User permission update - Error: {e}")

def main():
    """Main test function"""
    print("🚀 Role Access API Test Suite")
    print("=" * 40)
    
    # Test 1: API connection
    if not test_api_connection():
        print("\n❌ Cannot proceed - server is not running")
        sys.exit(1)
    
    # Test 2: Endpoints without auth
    test_endpoints_without_auth()
    
    # Test 3: With demo token
    test_with_demo_token()
    
    # Test 4: Update permissions
    test_update_permission()
    
    print("\n✅ Test suite completed!")
    print("\n📝 Next steps:")
    print("1. Get a valid JWT token from your login endpoint")
    print("2. Replace DEMO_TOKEN in this script")
    print("3. Run the script again to test with authentication")
    print("\n🔗 To get a token:")
    print("1. Login to your system")
    print("2. Copy the JWT token from the response")
    print("3. Replace 'your-jwt-token-here' in this script")

if __name__ == "__main__":
    main()

