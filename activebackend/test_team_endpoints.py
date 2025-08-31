#!/usr/bin/env python3
"""
Test script for team endpoints
"""

import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:9900"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMTksImVtYWlsIjoiaHV6YWlmYUBTV0lTU0JPUklORy5jb20iLCJyb2xlIjoiYWRtaW4iLCJvcmdfaWQiOjUwLCJleHAiOjE3NTY2MzQ0ODd9.V1n-7Pl5pXYLkibbpw0Ll04QKN-XpxCD-yY5kgqiO5Q"

def test_assign_users_to_team():
    """Test assigning users to team 13"""
    url = f"{BASE_URL}/team/assign_teams"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {TOKEN}"
    }
    
    payload = {
        "team_id": 13,
        "user_emails": ["huzaifa@SWISSBORING.com", "mehardil@SWISSBORING.com"]
    }
    
    print("Testing assign users to team...")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_get_team_members(team_id):
    """Test getting team members"""
    url = f"{BASE_URL}/team/team_members/{team_id}"
    headers = {
        "Authorization": f"Bearer {TOKEN}"
    }
    
    print(f"\nTesting get team members for team {team_id}...")
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_get_teams_with_members():
    """Test getting teams with member counts"""
    url = f"{BASE_URL}/team/teams_with_members"
    headers = {
        "Authorization": f"Bearer {TOKEN}"
    }
    
    print(f"\nTesting get teams with member counts...")
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("Team API Test Script")
    print("=" * 40)
    
    # Test assigning users to team
    success1 = test_assign_users_to_team()
    
    # Test getting team members
    success2 = test_get_team_members(13)
    
    # Test getting teams with member counts
    success3 = test_get_teams_with_members()
    
    print("\n" + "=" * 40)
    print("Test Results:")
    print(f"Assign users: {'✅ PASS' if success1 else '❌ FAIL'}")
    print(f"Get team members: {'✅ PASS' if success2 else '❌ FAIL'}")
    print(f"Get teams with members: {'✅ PASS' if success3 else '❌ FAIL'}")
    print("=" * 40)



