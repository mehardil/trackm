#!/usr/bin/env python3
"""
Test Single Permission Update
This script tests the exact request format you're using: {module: 'Activity Log', role: 'viewer', has_access: true}
"""

import requests
import json

# Base URL
BASE_URL = "http://127.0.0.1:8000"

# Demo data
DEMO_TOKEN = "your-jwt-token-here"  # Replace with actual token
DEMO_ORG_ID = 50

def test_single_permission_update():
    """Test single permission update with exact request format"""
    print("🔄 Testing Single Permission Update")
    print("=" * 40)
    
    if DEMO_TOKEN == "your-jwt-token-here":
        print("⚠️  Please replace DEMO_TOKEN with your actual JWT token")
        return
    
    headers = {
        "Authorization": f"Bearer {DEMO_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Test cases with exact request format
    test_cases = [
        {
            "name": "Give viewer access to Activity Log",
            "data": {
                "module": "Activity Log",
                "role": "viewer",
                "has_access": True
            }
        },
        {
            "name": "Remove viewer access from Activity Log",
            "data": {
                "module": "Activity Log",
                "role": "viewer",
                "has_access": False
            }
        },
        {
            "name": "Give editor access to Teams",
            "data": {
                "module": "Teams",
                "role": "editor",
                "has_access": True
            }
        },
        {
            "name": "Give agent access to Dashboard",
            "data": {
                "module": "Dashboard",
                "role": "agent",
                "has_access": True
            }
        },
        {
            "name": "Give viewer access to Insights",
            "data": {
                "module": "Insights",
                "role": "viewer",
                "has_access": True
            }
        },
        {
            "name": "Give viewer access to Impact",
            "data": {
                "module": "Impact",
                "role": "viewer",
                "has_access": True
            }
        },
        {
            "name": "Give viewer access to API & Integrations",
            "data": {
                "module": "API & Integrations",
                "role": "viewer",
                "has_access": True
            }
        },
        {
            "name": "Give viewer access to Live Reports",
            "data": {
                "module": "Live Reports",
                "role": "viewer",
                "has_access": True
            }
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. {test_case['name']}")
        print(f"   Request: {test_case['data']}")
        
        try:
            response = requests.patch(
                f"{BASE_URL}/access/role-matrix/{DEMO_ORG_ID}/permission",
                headers=headers,
                json=test_case['data']
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Success: {result.get('message', 'Permission updated')}")
                print(f"   Response: {result}")
            else:
                print(f"   ❌ Failed: {response.status_code}")
                print(f"   Error: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print(f"\n✅ All tests completed!")
    print(f"\n📝 To use this in your application:")
    print(f"1. Replace DEMO_TOKEN with your actual JWT token")
    print(f"2. Update DEMO_ORG_ID if needed")
    print(f"3. The API endpoint is: PATCH /access/role-matrix/{DEMO_ORG_ID}/permission")
    print(f"4. Request format: {test_cases[0]['data']}")

if __name__ == "__main__":
    test_single_permission_update()

