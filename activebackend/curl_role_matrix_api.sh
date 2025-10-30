#!/bin/bash

# Role Matrix API - Complete cURL Examples for React Component
# This API matches the React component structure with modules as rows and roles as columns

# Base URL
BASE_URL="http://127.0.0.1:8000"

# Authentication token (replace with actual token from login)
TOKEN="<YOUR_TOKEN>"

# Organization ID (replace with actual organization ID)
ORG_ID="50"

echo "🔐 Role Matrix API - cURL Examples for React Component"
echo "======================================================"
echo ""

# 1. Get role matrix (main endpoint for React component)
echo "1. Get role matrix for organization"
echo "GET /access/role-matrix/{organization_id}"
echo "------------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-matrix/$ORG_ID"
echo -e "\n"

# 2. Get available roles in organization
echo "2. Get available roles in organization"
echo "GET /access/role-matrix/{organization_id}/roles"
echo "-----------------------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-matrix/$ORG_ID/roles"
echo -e "\n"

# 3. Get available modules
echo "3. Get available modules"
echo "GET /access/role-matrix/modules"
echo "-------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-matrix/modules"
echo -e "\n"

# 4. Update entire role matrix (bulk update)
echo "4. Update entire role matrix"
echo "PUT /access/role-matrix/{organization_id}"
echo "------------------------------------------"
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
          "viewer": "access"
        }
      },
      {
        "section": "Teams",
        "permissions": {
          "admin": "access",
          "editor": "access",
          "viewer": "none"
        }
      },
      {
        "section": "Insights",
        "permissions": {
          "admin": "access",
          "editor": "access",
          "viewer": "none"
        }
      },
      {
        "section": "Settings",
        "permissions": {
          "admin": "always",
          "editor": "none",
          "viewer": "none"
        }
      }
    ]
  }' \
  "$BASE_URL/access/role-matrix/$ORG_ID"
echo -e "\n"

# 5. Update single permission (for individual checkbox toggle)
echo "5. Update single permission - Give editor access to Teams"
echo "PATCH /access/role-matrix/{organization_id}/permission"
echo "------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Teams",
    "role": "editor",
    "has_access": true
  }' \
  "$BASE_URL/access/role-matrix/$ORG_ID/permission"
echo -e "\n"

# 6. Update single permission - Remove viewer access from Insights
echo "6. Update single permission - Remove viewer access from Insights"
echo "PATCH /access/role-matrix/{organization_id}/permission"
echo "------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Insights",
    "role": "viewer",
    "has_access": false
  }' \
  "$BASE_URL/access/role-matrix/$ORG_ID/permission"
echo -e "\n"

# 7. Update single permission - Give admin access to Dashboard
echo "7. Update single permission - Give admin access to Dashboard"
echo "PATCH /access/role-matrix/{organization_id}/permission"
echo "------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Dashboard",
    "role": "admin",
    "has_access": true
  }' \
  "$BASE_URL/access/role-matrix/$ORG_ID/permission"
echo -e "\n"

# 8. Update single permission - Remove editor access from Settings
echo "8. Update single permission - Remove editor access from Settings"
echo "PATCH /access/role-matrix/{organization_id}/permission"
echo "------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Settings",
    "role": "editor",
    "has_access": false
  }' \
  "$BASE_URL/access/role-matrix/$ORG_ID/permission"
echo -e "\n"

# 9. Get role matrix again to see changes
echo "9. Get role matrix again to see changes"
echo "GET /access/role-matrix/{organization_id}"
echo "----------------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-matrix/$ORG_ID"
echo -e "\n"

echo "✅ All Role Matrix API examples completed!"
echo ""
echo "📝 Notes:"
echo "- Replace <YOUR_TOKEN> with actual JWT token from login"
echo "- Replace <ORG_ID> with actual organization ID"
echo "- Make sure the FastAPI server is running on http://127.0.0.1:8000"
echo "- Only admins can update role permissions"
echo "- The matrix structure matches your React component exactly"
echo ""
echo "🔗 React Component Integration:"
echo "- Use GET /access/role-matrix/{org_id} to load initial data"
echo "- Use PATCH /access/role-matrix/{org_id}/permission for individual toggles"
echo "- Use PUT /access/role-matrix/{org_id} for bulk updates"
echo "- Response format matches your accessMatrix structure"

