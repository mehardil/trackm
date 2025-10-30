#!/bin/bash

# Quick Role Access API Test
# This script tests the most important endpoints with demo data

# Base URL
BASE_URL="http://127.0.0.1:8000"

# Demo Authentication token (replace with actual token from login)
TOKEN="<YOUR_TOKEN>"

# Demo Organization ID (replace with actual organization ID)
ORG_ID="50"

echo "🚀 Quick Role Access API Test"
echo "============================="
echo ""

# 1. Test if server is running
echo "1. Testing server connection..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/" && echo " ✅ Server is running" || echo " ❌ Server is not running"
echo ""

# 2. Test getting all permissions
echo "2. Get All Permissions (17 permissions from your database)"
echo "GET /access/role-access/permissions"
echo "-----------------------------------"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/permissions" | jq '. | length' && echo " permissions found"
echo ""

# 3. Test getting role matrix
echo "3. Get Role Matrix (Modules as rows, Roles as columns)"
echo "GET /access/role-matrix/$ORG_ID"
echo "------------------------------------------------------"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-matrix/$ORG_ID" | jq '.success'
echo ""

# 4. Test getting user permission matrix
echo "4. Get User Permission Matrix (Permissions as rows, Users as columns)"
echo "GET /access/user-permission-matrix/$ORG_ID"
echo "--------------------------------------------------------"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/user-permission-matrix/$ORG_ID" | jq '.success'
echo ""

# 5. Test updating a single permission
echo "5. Update Single Permission - Give editor access to Teams"
echo "PATCH /access/role-matrix/$ORG_ID/permission"
echo "--------------------------------------------------------"
curl -s -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Teams",
    "role": "editor",
    "has_access": true
  }' \
  "$BASE_URL/access/role-matrix/$ORG_ID/permission" | jq '.success'
echo ""

# 6. Test updating user permission
echo "6. Update User Permission - Give user 121 access to Dashboard"
echo "PATCH /access/user-permission-matrix/$ORG_ID/permission"
echo "--------------------------------------------------------"
curl -s -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 121,
    "permission_id": 1,
    "has_access": true
  }' \
  "$BASE_URL/access/user-permission-matrix/$ORG_ID/permission" | jq '.success'
echo ""

echo "✅ Quick test completed!"
echo ""
echo "📝 To run the full test:"
echo "chmod +x test_role_access_api_demo.sh"
echo "./test_role_access_api_demo.sh"
echo ""
echo "🔧 To get a real token:"
echo "1. Login to your system"
echo "2. Copy the JWT token from the response"
echo "3. Replace <YOUR_TOKEN> in this script"
echo ""
echo "📊 Expected Results:"
echo "- Server should return 200 status"
echo "- Permissions should return 17 items"
echo "- All API calls should return success: true"
echo "- If any call fails, check your token and organization ID"

