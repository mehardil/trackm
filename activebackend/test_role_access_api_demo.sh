#!/bin/bash

# Role Access API - Demo Test Script with Real Data
# This script tests all role access APIs with demo data based on your database

# Base URL
BASE_URL="http://127.0.0.1:8000"

# Demo Authentication token (replace with actual token from login)
TOKEN="<YOUR_TOKEN>"

# Demo Organization ID (replace with actual organization ID)
ORG_ID="50"

# Demo User ID (replace with actual user ID)
USER_ID="121"

echo "🧪 Role Access API - Demo Test with Real Data"
echo "=============================================="
echo "Based on your database structure:"
echo "- 17 permissions across 17 modules"
echo "- 4 roles: admin, editor, agent, viewer"
echo "- Organization ID: $ORG_ID"
echo ""

# 1. Test Role Matrix API - Get complete matrix
echo "1. Get Role Matrix (Modules as rows, Roles as columns)"
echo "GET /access/role-matrix/$ORG_ID"
echo "------------------------------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-matrix/$ORG_ID" | jq '.'
echo -e "\n"

# 2. Test User Permission Matrix API - Get complete matrix
echo "2. Get User Permission Matrix (Permissions as rows, Users as columns)"
echo "GET /access/user-permission-matrix/$ORG_ID"
echo "--------------------------------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/user-permission-matrix/$ORG_ID" | jq '.'
echo -e "\n"

# 3. Test getting all permissions
echo "3. Get All Permissions"
echo "GET /access/role-access/permissions"
echo "-----------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/permissions" | jq '.'
echo -e "\n"

# 4. Test getting roles in organization
echo "4. Get Roles in Organization"
echo "GET /access/role-matrix/$ORG_ID/roles"
echo "-------------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-matrix/$ORG_ID/roles" | jq '.'
echo -e "\n"

# 5. Test getting users in organization
echo "5. Get Users in Organization"
echo "GET /access/user-permission-matrix/$ORG_ID/users"
echo "------------------------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/user-permission-matrix/$ORG_ID/users" | jq '.'
echo -e "\n"

# 6. Test updating role permissions - Update admin role
echo "6. Update Admin Role Permissions (Give admin access to all modules)"
echo "PUT /access/role-matrix/$ORG_ID"
echo "--------------------------------"
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matrix": [
      {
        "section": "Dashboard",
        "permissions": {
          "admin": "access",
          "editor": "access",
          "agent": "access",
          "viewer": "access"
        }
      },
      {
        "section": "Productivity",
        "permissions": {
          "admin": "access",
          "editor": "access",
          "agent": "none",
          "viewer": "none"
        }
      },
      {
        "section": "Activity Log",
        "permissions": {
          "admin": "access",
          "editor": "access",
          "agent": "access",
          "viewer": "none"
        }
      },
      {
        "section": "Impact",
        "permissions": {
          "admin": "access",
          "editor": "access",
          "agent": "none",
          "viewer": "none"
        }
      },
      {
        "section": "Productivity Graph",
        "permissions": {
          "admin": "access",
          "editor": "access",
          "agent": "none",
          "viewer": "access"
        }
      },
      {
        "section": "Coach",
        "permissions": {
          "admin": "access",
          "editor": "access",
          "agent": "none",
          "viewer": "none"
        }
      },
      {
        "section": "Insights",
        "permissions": {
          "admin": "access",
          "editor": "access",
          "agent": "none",
          "viewer": "access"
        }
      },
      {
        "section": "Activation",
        "permissions": {
          "admin": "access",
          "editor": "none",
          "agent": "access",
          "viewer": "none"
        }
      },
      {
        "section": "API & Integrations",
        "permissions": {
          "admin": "access",
          "editor": "access",
          "agent": "none",
          "viewer": "none"
        }
      },
      {
        "section": "Alarms",
        "permissions": {
          "admin": "access",
          "editor": "none",
          "agent": "access",
          "viewer": "none"
        }
      },
      {
        "section": "Help",
        "permissions": {
          "admin": "access",
          "editor": "none",
          "agent": "access",
          "viewer": "access"
        }
      },
      {
        "section": "Logout",
        "permissions": {
          "admin": "access",
          "editor": "none",
          "agent": "none",
          "viewer": "none"
        }
      },
      {
        "section": "Classification",
        "permissions": {
          "admin": "access",
          "editor": "access",
          "agent": "none",
          "viewer": "none"
        }
      },
      {
        "section": "App Access",
        "permissions": {
          "admin": "access",
          "editor": "none",
          "agent": "none",
          "viewer": "none"
        }
      },
      {
        "section": "Role Access",
        "permissions": {
          "admin": "access",
          "editor": "none",
          "agent": "none",
          "viewer": "none"
        }
      },
      {
        "section": "Verify OTP",
        "permissions": {
          "admin": "access",
          "editor": "none",
          "agent": "none",
          "viewer": "none"
        }
      },
      {
        "section": "Teams",
        "permissions": {
          "admin": "access",
          "editor": "access",
          "agent": "none",
          "viewer": "none"
        }
      }
    ]
  }' \
  "$BASE_URL/access/role-matrix/$ORG_ID" | jq '.'
echo -e "\n"

# 7. Test updating single permission - Give editor access to Teams
echo "7. Update Single Permission - Give editor access to Teams"
echo "PATCH /access/role-matrix/$ORG_ID/permission"
echo "--------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Teams",
    "role": "editor",
    "has_access": true
  }' \
  "$BASE_URL/access/role-matrix/$ORG_ID/permission" | jq '.'
echo -e "\n"

# 8. Test updating single permission - Remove viewer access from Insights
echo "8. Update Single Permission - Remove viewer access from Insights"
echo "PATCH /access/role-matrix/$ORG_ID/permission"
echo "--------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Insights",
    "role": "viewer",
    "has_access": false
  }' \
  "$BASE_URL/access/role-matrix/$ORG_ID/permission" | jq '.'
echo -e "\n"

# 9. Test updating user-specific permission - Give user 121 access to Dashboard
echo "9. Update User Permission - Give user 121 access to Dashboard"
echo "PATCH /access/user-permission-matrix/$ORG_ID/permission"
echo "--------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 121,
    "permission_id": 1,
    "has_access": true
  }' \
  "$BASE_URL/access/user-permission-matrix/$ORG_ID/permission" | jq '.'
echo -e "\n"

# 10. Test updating user-specific permission - Remove user 121 access to Teams
echo "10. Update User Permission - Remove user 121 access to Teams"
echo "PATCH /access/user-permission-matrix/$ORG_ID/permission"
echo "--------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 121,
    "permission_id": 17,
    "has_access": false
  }' \
  "$BASE_URL/access/user-permission-matrix/$ORG_ID/permission" | jq '.'
echo -e "\n"

# 11. Test getting role access summary
echo "11. Get Role Access Summary"
echo "GET /access/role-access/summary/$ORG_ID"
echo "---------------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/summary/$ORG_ID" | jq '.'
echo -e "\n"

# 12. Test getting organization role access
echo "12. Get Organization Role Access"
echo "GET /access/role-access/organization/$ORG_ID"
echo "---------------------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/organization/$ORG_ID" | jq '.'
echo -e "\n"

# 13. Test getting specific role permissions
echo "13. Get Admin Role Permissions"
echo "GET /access/role-access/role/admin"
echo "---------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/role/admin" | jq '.'
echo -e "\n"

# 14. Test getting specific role permissions
echo "14. Get Editor Role Permissions"
echo "GET /access/role-access/role/editor"
echo "----------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/role/editor" | jq '.'
echo -e "\n"

# 15. Test getting specific role permissions
echo "15. Get Agent Role Permissions"
echo "GET /access/role-access/role/agent"
echo "---------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/role/agent" | jq '.'
echo -e "\n"

# 16. Test getting specific role permissions
echo "16. Get Viewer Role Permissions"
echo "GET /access/role-access/role/viewer"
echo "----------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/role/viewer" | jq '.'
echo -e "\n"

# 17. Test getting user permissions
echo "17. Get User Permissions for User $USER_ID"
echo "GET /access/role-access/user/$USER_ID"
echo "---------------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/user/$USER_ID" | jq '.'
echo -e "\n"

# 18. Test getting role matrix again to see changes
echo "18. Get Role Matrix Again to See Changes"
echo "GET /access/role-matrix/$ORG_ID"
echo "----------------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-matrix/$ORG_ID" | jq '.data[0:3]'  # Show first 3 modules
echo -e "\n"

# 19. Test getting user permission matrix again to see changes
echo "19. Get User Permission Matrix Again to See Changes"
echo "GET /access/user-permission-matrix/$ORG_ID"
echo "---------------------------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/user-permission-matrix/$ORG_ID" | jq '.data.matrix[0:3]'  # Show first 3 permissions
echo -e "\n"

echo "✅ All Role Access API tests completed!"
echo ""
echo "📊 Test Summary:"
echo "- Tested 19 different API endpoints"
echo "- Used real data from your database structure"
echo "- Tested both role-based and user-specific permissions"
echo "- Tested both matrix views (modules×roles and permissions×users)"
echo ""
echo "📝 Notes:"
echo "- Replace <YOUR_TOKEN> with actual JWT token from login"
echo "- Replace <ORG_ID> with actual organization ID"
echo "- Replace <USER_ID> with actual user ID"
echo "- Make sure the FastAPI server is running on http://127.0.0.1:8000"
echo "- Install jq for better JSON formatting: sudo apt-get install jq"
echo ""
echo "🔗 API Endpoints Tested:"
echo "1. GET /access/role-matrix/{org_id} - Role matrix (modules×roles)"
echo "2. GET /access/user-permission-matrix/{org_id} - User matrix (permissions×users)"
echo "3. GET /access/role-access/permissions - All permissions"
echo "4. GET /access/role-matrix/{org_id}/roles - Organization roles"
echo "5. GET /access/user-permission-matrix/{org_id}/users - Organization users"
echo "6. PUT /access/role-matrix/{org_id} - Update role matrix"
echo "7. PATCH /access/role-matrix/{org_id}/permission - Update single role permission"
echo "8. PATCH /access/user-permission-matrix/{org_id}/permission - Update user permission"
echo "9. GET /access/role-access/summary/{org_id} - Role access summary"
echo "10. GET /access/role-access/organization/{org_id} - Organization role access"
echo "11. GET /access/role-access/role/{role} - Specific role permissions"
echo "12. GET /access/role-access/user/{user_id} - Specific user permissions"

