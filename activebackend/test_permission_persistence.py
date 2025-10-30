#!/usr/bin/env python3
"""
Test script to verify that admin permission changes persist across logins
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:8000"
ADMIN_TOKEN = "YOUR_ADMIN_JWT_TOKEN_HERE"  # Replace with admin token

def test_permission_persistence():
    """Test that admin permission changes persist and are not reset on login"""
    print("Testing permission persistence...")
    
    headers = {
        "Authorization": f"Bearer {ADMIN_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Step 1: Get current role matrix
    print("1. Getting current role matrix...")
    response = requests.get(f"{BASE_URL}/access/role-matrix/org", headers=headers)
    if response.status_code != 200:
        print(f"Failed to get role matrix: {response.text}")
        return
    
    original_matrix = response.json()["data"]
    print(f"Original matrix has {len(original_matrix)} modules")
    
    # Step 2: Change a permission (disable admin access to a module)
    print("2. Changing admin permission...")
    test_module = "Activation"  # Change this to a module that exists
    update_data = {
        "module": test_module,
        "role": "admin",
        "has_access": False
    }
    
    response = requests.patch(
        f"{BASE_URL}/access/role-matrix/permission",
        headers=headers,
        json=update_data
    )
    
    if response.status_code != 200:
        print(f"Failed to update permission: {response.text}")
        return
    
    print("Permission updated successfully")
    
    # Step 3: Get role matrix again to verify change
    print("3. Verifying permission change...")
    response = requests.get(f"{BASE_URL}/access/role-matrix/org", headers=headers)
    if response.status_code != 200:
        print(f"Failed to get updated role matrix: {response.text}")
        return
    
    updated_matrix = response.json()["data"]
    
    # Find the test module in the matrix
    test_module_data = None
    for module_data in updated_matrix:
        if module_data["section"] == test_module:
            test_module_data = module_data
            break
    
    if test_module_data:
        admin_access = test_module_data["permissions"].get("admin", "unknown")
        print(f"Admin access to {test_module}: {admin_access}")
        
        if admin_access == "none":
            print("✅ Permission change persisted correctly!")
        else:
            print("❌ Permission change was not persisted!")
    else:
        print(f"❌ Could not find module {test_module} in matrix")
    
    # Step 4: Simulate login by calling the endpoint again
    print("4. Simulating login (calling role matrix again)...")
    response = requests.get(f"{BASE_URL}/access/role-matrix/org", headers=headers)
    if response.status_code != 200:
        print(f"Failed to get role matrix after 'login': {response.text}")
        return
    
    final_matrix = response.json()["data"]
    
    # Check if permission is still changed
    final_module_data = None
    for module_data in final_matrix:
        if module_data["section"] == test_module:
            final_module_data = module_data
            break
    
    if final_module_data:
        final_admin_access = final_module_data["permissions"].get("admin", "unknown")
        print(f"Admin access to {test_module} after 'login': {final_admin_access}")
        
        if final_admin_access == "none":
            print("✅ Permission change persisted across 'login'!")
        else:
            print("❌ Permission change was reset on 'login'!")
    else:
        print(f"❌ Could not find module {test_module} in final matrix")

def test_multiple_logins():
    """Test multiple consecutive calls to simulate multiple logins"""
    print("\nTesting multiple consecutive 'logins'...")
    
    headers = {
        "Authorization": f"Bearer {ADMIN_TOKEN}",
        "Content-Type": "application/json"
    }
    
    for i in range(3):
        print(f"Login attempt {i+1}...")
        response = requests.get(f"{BASE_URL}/access/role-matrix/org", headers=headers)
        if response.status_code == 200:
            matrix = response.json()["data"]
            print(f"  ✅ Success - got {len(matrix)} modules")
        else:
            print(f"  ❌ Failed: {response.text}")
        time.sleep(0.5)  # Small delay between requests

if __name__ == "__main__":
    print("=== Permission Persistence Test ===")
    print(f"Base URL: {BASE_URL}")
    print(f"Token: {ADMIN_TOKEN[:20]}..." if len(ADMIN_TOKEN) > 20 else f"Token: {ADMIN_TOKEN}")
    
    if ADMIN_TOKEN == "YOUR_ADMIN_JWT_TOKEN_HERE":
        print("\n⚠️  Please update ADMIN_TOKEN with a valid admin JWT token")
        print("You can get a token by logging in as an admin via POST /login/login/")
    else:
        test_permission_persistence()
        test_multiple_logins()
    
    print("\n=== Test Complete ===")
















