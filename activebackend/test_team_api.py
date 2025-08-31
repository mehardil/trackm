#!/usr/bin/env python3
"""
Test script for the new team assignment API endpoints
"""

import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:9900"
TOKEN = "your_bearer_token_here"  # Replace with actual token

def test_assign_users_to_team():
    """Test assigning users to a team"""
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
    except Exception as e:
        print(f"Error: {e}")

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
    except Exception as e:
        print(f"Error: {e}")

def test_remove_users_from_team():
    """Test removing users from a team"""
    url = f"{BASE_URL}/team/remove_users_from_team"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {TOKEN}"
    }
    
    payload = {
        "team_id": 13,
        "user_emails": ["mehardil@SWISSBORING.com"]
    }
    
    print("\nTesting remove users from team...")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.delete(url, headers=headers, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Team Management API Test Script")
    print("=" * 40)
    
    # Test assigning users to team
    test_assign_users_to_team()
    
    # Test getting team members
    test_get_team_members(13)
    
    # Test removing users from team
    test_remove_users_from_team()
    
    print("\nTest completed!")



