#!/bin/bash

# User Permission Matrix API - cURL Examples
# This API shows permissions as rows and users as columns

# Base URL
BASE_URL="http://127.0.0.1:8000"

# Authentication token (replace with actual token from login)
TOKEN="<YOUR_TOKEN>"

# Organization ID (replace with actual organization ID)
ORG_ID="50"

echo "🔐 User Permission Matrix API - cURL Examples"
echo "============================================="
echo "Permissions as rows, Users as columns"
echo ""

# 1. Get user permission matrix (main endpoint)
echo "1. Get user permission matrix"
echo "GET /access/user-permission-matrix/{organization_id}"
echo "----------------------------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/user-permission-matrix/$ORG_ID"
echo -e "\n"

# 2. Get users in organization
echo "2. Get users in organization"
echo "GET /access/user-permission-matrix/{organization_id}/users"
echo "----------------------------------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/user-permission-matrix/$ORG_ID/users"
echo -e "\n"

# 3. Update user permission - Give user 121 access to Dashboard
echo "3. Update user permission - Give user 121 access to Dashboard"
echo "PATCH /access/user-permission-matrix/{organization_id}/permission"
echo "----------------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 121,
    "permission_id": 1,
    "has_access": true
  }' \
  "$BASE_URL/access/user-permission-matrix/$ORG_ID/permission"
echo -e "\n"

# 4. Update user permission - Remove user 121 access to Teams
echo "4. Update user permission - Remove user 121 access to Teams"
echo "PATCH /access/user-permission-matrix/{organization_id}/permission"
echo "----------------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 121,
    "permission_id": 17,
    "has_access": false
  }' \
  "$BASE_URL/access/user-permission-matrix/$ORG_ID/permission"
echo -e "\n"

# 5. Update user permission - Give user 122 access to Insights
echo "5. Update user permission - Give user 122 access to Insights"
echo "PATCH /access/user-permission-matrix/{organization_id}/permission"
echo "----------------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 122,
    "permission_id": 7,
    "has_access": true
  }' \
  "$BASE_URL/access/user-permission-matrix/$ORG_ID/permission"
echo -e "\n"

# 6. Update user permission - Give user 123 access to Settings
echo "6. Update user permission - Give user 123 access to Settings"
echo "PATCH /access/user-permission-matrix/{organization_id}/permission"
echo "----------------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123,
    "permission_id": 14,
    "has_access": true
  }' \
  "$BASE_URL/access/user-permission-matrix/$ORG_ID/permission"
echo -e "\n"

# 7. Get user permission matrix again to see changes
echo "7. Get user permission matrix again to see changes"
echo "GET /access/user-permission-matrix/{organization_id}"
echo "----------------------------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/user-permission-matrix/$ORG_ID"
echo -e "\n"

# 8. Get specific permission data with jq formatting
echo "8. Get specific permission data (formatted with jq)"
echo "GET /access/user-permission-matrix/{organization_id} | jq '.data.matrix[0]'"
echo "----------------------------------------------------------------------"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/user-permission-matrix/$ORG_ID" | jq '.data.matrix[0]'
echo -e "\n"

# 9. Get users data with jq formatting
echo "9. Get users data (formatted with jq)"
echo "GET /access/user-permission-matrix/{organization_id}/users | jq '.users'"
echo "----------------------------------------------------------------------"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/user-permission-matrix/$ORG_ID/users" | jq '.users'
echo -e "\n"

# 10. Get permissions data with jq formatting
echo "10. Get permissions data (formatted with jq)"
echo "GET /access/user-permission-matrix/{organization_id} | jq '.data.permissions'"
echo "----------------------------------------------------------------------"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/user-permission-matrix/$ORG_ID" | jq '.data.permissions'
echo -e "\n"

echo "✅ All User Permission Matrix API examples completed!"
echo ""
echo "📝 Notes:"
echo "- Replace <YOUR_TOKEN> with actual JWT token from login"
echo "- Replace <ORG_ID> with actual organization ID"
echo "- Make sure the FastAPI server is running on http://127.0.0.1:8000"
echo "- Only admins and configurators can update user permissions"
echo "- The matrix shows permissions as rows and users as columns"
echo ""
echo "🔗 Response Structure:"
echo "- matrix: Array of permissions with user access data"
echo "- users: Array of users in the organization"
echo "- permissions: Array of all available permissions"
echo "- organization_id: The organization ID"
echo ""
echo "📊 Matrix Format:"
echo "Each permission row contains:"
echo "- id: Permission ID"
echo "- code: Permission code (e.g., 'dashboard.view')"
echo "- module: Module name (e.g., 'Dashboard')"
echo "- users: Object with user_id as key and access data as value"
echo "  - user_id: User ID"
echo "  - user_name: User's full name"
echo "  - user_email: User's email"
echo "  - user_role: User's role"
echo "  - has_access: Boolean indicating access"
echo "  - permission_source: 'user_specific' or 'role_based'"
