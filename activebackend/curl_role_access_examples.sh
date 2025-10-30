#!/bin/bash

# Role Access API - Complete cURL Examples
# Make sure to replace <YOUR_TOKEN> with actual JWT token and <ORG_ID> with actual organization ID

# Base URL
BASE_URL="http://127.0.0.1:8000"

# Authentication token (replace with actual token from login)
TOKEN="<YOUR_TOKEN>"

# Organization ID (replace with actual organization ID)
ORG_ID="50"

# User ID for testing (replace with actual user ID)
USER_ID="121"

echo "🔐 Role Access API - cURL Examples"
echo "=================================="
echo ""

# 1. Get all available permissions
echo "1. Get all available permissions"
echo "GET /access/role-access/permissions"
echo "-----------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/permissions"
echo -e "\n"

# 2. Get roles in organization
echo "2. Get roles in organization"
echo "GET /access/role-access/roles/{organization_id}"
echo "-----------------------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/roles/$ORG_ID"
echo -e "\n"

# 3. Get role access for organization
echo "3. Get role access for organization"
echo "GET /access/role-access/organization/{organization_id}"
echo "------------------------------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/organization/$ORG_ID"
echo -e "\n"

# 4. Get role access summary
echo "4. Get role access summary"
echo "GET /access/role-access/summary/{organization_id}"
echo "--------------------------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/summary/$ORG_ID"
echo -e "\n"

# 5. Get permissions for specific role (admin)
echo "5. Get permissions for admin role"
echo "GET /access/role-access/role/admin"
echo "----------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/role/admin"
echo -e "\n"

# 6. Get permissions for specific role (viewer)
echo "6. Get permissions for viewer role"
echo "GET /access/role-access/role/viewer"
echo "-----------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/role/viewer"
echo -e "\n"

# 7. Get permissions for specific role (editor)
echo "7. Get permissions for editor role"
echo "GET /access/role-access/role/editor"
echo "-----------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/role/editor"
echo -e "\n"

# 8. Get permissions for specific role (agent)
echo "8. Get permissions for agent role"
echo "GET /access/role-access/role/agent"
echo "----------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/role/agent"
echo -e "\n"

# 9. Get user permissions
echo "9. Get user permissions"
echo "GET /access/role-access/user/{user_id}"
echo "--------------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/user/$USER_ID"
echo -e "\n"

# 10. Update role permissions (admin role)
echo "10. Update admin role permissions"
echo "PUT /access/role-access/role/admin"
echo "----------------------------------"
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin",
    "permissions": [
      {"permission_id": 1, "has_access": true},
      {"permission_id": 2, "has_access": true},
      {"permission_id": 3, "has_access": true},
      {"permission_id": 4, "has_access": true},
      {"permission_id": 5, "has_access": true},
      {"permission_id": 6, "has_access": true},
      {"permission_id": 7, "has_access": true},
      {"permission_id": 8, "has_access": true},
      {"permission_id": 9, "has_access": true},
      {"permission_id": 10, "has_access": true},
      {"permission_id": 11, "has_access": true},
      {"permission_id": 12, "has_access": true},
      {"permission_id": 13, "has_access": true},
      {"permission_id": 14, "has_access": true},
      {"permission_id": 15, "has_access": true},
      {"permission_id": 16, "has_access": true},
      {"permission_id": 17, "has_access": true}
    ]
  }' \
  "$BASE_URL/access/role-access/role/admin"
echo -e "\n"

# 11. Update role permissions (viewer role)
echo "11. Update viewer role permissions"
echo "PUT /access/role-access/role/viewer"
echo "-----------------------------------"
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "viewer",
    "permissions": [
      {"permission_id": 1, "has_access": true},
      {"permission_id": 2, "has_access": false},
      {"permission_id": 3, "has_access": false},
      {"permission_id": 4, "has_access": false},
      {"permission_id": 5, "has_access": true},
      {"permission_id": 6, "has_access": false},
      {"permission_id": 7, "has_access": true},
      {"permission_id": 8, "has_access": false},
      {"permission_id": 9, "has_access": false},
      {"permission_id": 10, "has_access": false},
      {"permission_id": 11, "has_access": true},
      {"permission_id": 12, "has_access": false},
      {"permission_id": 13, "has_access": false},
      {"permission_id": 14, "has_access": false},
      {"permission_id": 15, "has_access": false},
      {"permission_id": 16, "has_access": false},
      {"permission_id": 17, "has_access": false}
    ]
  }' \
  "$BASE_URL/access/role-access/role/viewer"
echo -e "\n"

# 12. Update role permissions (editor role)
echo "12. Update editor role permissions"
echo "PUT /access/role-access/role/editor"
echo "-----------------------------------"
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "editor",
    "permissions": [
      {"permission_id": 1, "has_access": true},
      {"permission_id": 2, "has_access": true},
      {"permission_id": 3, "has_access": true},
      {"permission_id": 4, "has_access": true},
      {"permission_id": 5, "has_access": true},
      {"permission_id": 6, "has_access": true},
      {"permission_id": 7, "has_access": true},
      {"permission_id": 8, "has_access": false},
      {"permission_id": 9, "has_access": false},
      {"permission_id": 10, "has_access": false},
      {"permission_id": 11, "has_access": false},
      {"permission_id": 12, "has_access": false},
      {"permission_id": 13, "has_access": false},
      {"permission_id": 14, "has_access": false},
      {"permission_id": 15, "has_access": false},
      {"permission_id": 16, "has_access": false},
      {"permission_id": 17, "has_access": false}
    ]
  }' \
  "$BASE_URL/access/role-access/role/editor"
echo -e "\n"

# 13. Update role permissions (agent role)
echo "13. Update agent role permissions"
echo "PUT /access/role-access/role/agent"
echo "----------------------------------"
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "agent",
    "permissions": [
      {"permission_id": 1, "has_access": true},
      {"permission_id": 2, "has_access": false},
      {"permission_id": 3, "has_access": true},
      {"permission_id": 4, "has_access": false},
      {"permission_id": 5, "has_access": false},
      {"permission_id": 6, "has_access": false},
      {"permission_id": 7, "has_access": false},
      {"permission_id": 8, "has_access": true},
      {"permission_id": 9, "has_access": false},
      {"permission_id": 10, "has_access": true},
      {"permission_id": 11, "has_access": true},
      {"permission_id": 12, "has_access": false},
      {"permission_id": 13, "has_access": false},
      {"permission_id": 14, "has_access": false},
      {"permission_id": 15, "has_access": false},
      {"permission_id": 16, "has_access": false},
      {"permission_id": 17, "has_access": false}
    ]
  }' \
  "$BASE_URL/access/role-access/role/agent"
echo -e "\n"

# 14. Update user-specific permissions
echo "14. Update user-specific permissions"
echo "PUT /access/role-access/user/{user_id}"
echo "-------------------------------------"
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 121,
    "permissions": [
      {"permission_id": 1, "has_access": true},
      {"permission_id": 2, "has_access": true},
      {"permission_id": 3, "has_access": false},
      {"permission_id": 4, "has_access": true},
      {"permission_id": 5, "has_access": false},
      {"permission_id": 6, "has_access": true},
      {"permission_id": 7, "has_access": true},
      {"permission_id": 8, "has_access": false},
      {"permission_id": 9, "has_access": true},
      {"permission_id": 10, "has_access": false},
      {"permission_id": 11, "has_access": true},
      {"permission_id": 12, "has_access": false},
      {"permission_id": 13, "has_access": true},
      {"permission_id": 14, "has_access": false},
      {"permission_id": 15, "has_access": true},
      {"permission_id": 16, "has_access": false},
      {"permission_id": 17, "has_access": true}
    ]
  }' \
  "$BASE_URL/access/role-access/user/$USER_ID"
echo -e "\n"

echo "✅ All cURL examples completed!"
echo ""
echo "📝 Notes:"
echo "- Replace <YOUR_TOKEN> with actual JWT token from login"
echo "- Replace <ORG_ID> with actual organization ID"
echo "- Replace <USER_ID> with actual user ID"
echo "- Make sure the FastAPI server is running on http://127.0.0.1:8000"
echo "- Some endpoints require admin or configurator role"


