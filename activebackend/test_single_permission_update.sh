#!/bin/bash

# Test Single Permission Update
# This script tests the exact request format you're using

# Base URL
BASE_URL="http://127.0.0.1:8000"

# Demo Authentication token (replace with actual token from login)
TOKEN="<YOUR_TOKEN>"

# Demo Organization ID (replace with actual organization ID)
ORG_ID="50"

echo "🔄 Testing Single Permission Update"
echo "=================================="
echo "Testing exact request format: {module: 'Activity Log', role: 'viewer', has_access: true}"
echo ""

# Test 1: Give viewer access to Activity Log
echo "1. Give viewer access to Activity Log"
echo "PATCH /access/role-matrix/$ORG_ID/permission"
echo "Request Body: {module: 'Activity Log', role: 'viewer', has_access: true}"
echo "----------------------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Activity Log",
    "role": "viewer",
    "has_access": true
  }' \
  "$BASE_URL/access/role-matrix/$ORG_ID/permission" | jq '.'
echo -e "\n"

# Test 2: Remove viewer access from Activity Log
echo "2. Remove viewer access from Activity Log"
echo "PATCH /access/role-matrix/$ORG_ID/permission"
echo "Request Body: {module: 'Activity Log', role: 'viewer', has_access: false}"
echo "----------------------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Activity Log",
    "role": "viewer",
    "has_access": false
  }' \
  "$BASE_URL/access/role-matrix/$ORG_ID/permission" | jq '.'
echo -e "\n"

# Test 3: Give editor access to Teams
echo "3. Give editor access to Teams"
echo "PATCH /access/role-matrix/$ORG_ID/permission"
echo "Request Body: {module: 'Teams', role: 'editor', has_access: true}"
echo "----------------------------------------------------------------------"
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

# Test 4: Give agent access to Dashboard
echo "4. Give agent access to Dashboard"
echo "PATCH /access/role-matrix/$ORG_ID/permission"
echo "Request Body: {module: 'Dashboard', role: 'agent', has_access: true}"
echo "----------------------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Dashboard",
    "role": "agent",
    "has_access": true
  }' \
  "$BASE_URL/access/role-matrix/$ORG_ID/permission" | jq '.'
echo -e "\n"

# Test 5: Remove admin access from Help (this should fail as admin has always access)
echo "5. Try to remove admin access from Help (should fail)"
echo "PATCH /access/role-matrix/$ORG_ID/permission"
echo "Request Body: {module: 'Help', role: 'admin', has_access: false}"
echo "----------------------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Help",
    "role": "admin",
    "has_access": false
  }' \
  "$BASE_URL/access/role-matrix/$ORG_ID/permission" | jq '.'
echo -e "\n"

# Test 6: Give viewer access to Insights
echo "6. Give viewer access to Insights"
echo "PATCH /access/role-matrix/$ORG_ID/permission"
echo "Request Body: {module: 'Insights', role: 'viewer', has_access: true}"
echo "----------------------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Insights",
    "role": "viewer",
    "has_access": true
  }' \
  "$BASE_URL/access/role-matrix/$ORG_ID/permission" | jq '.'
echo -e "\n"

# Test 7: Give viewer access to Impact
echo "7. Give viewer access to Impact"
echo "PATCH /access/role-matrix/$ORG_ID/permission"
echo "Request Body: {module: 'Impact', role: 'viewer', has_access: true}"
echo "----------------------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Impact",
    "role": "viewer",
    "has_access": true
  }' \
  "$BASE_URL/access/role-matrix/$ORG_ID/permission" | jq '.'
echo -e "\n"

# Test 8: Give viewer access to API & Integrations
echo "8. Give viewer access to API & Integrations"
echo "PATCH /access/role-matrix/$ORG_ID/permission"
echo "Request Body: {module: 'API & Integrations', role: 'viewer', has_access: true}"
echo "----------------------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "API & Integrations",
    "role": "viewer",
    "has_access": true
  }' \
  "$BASE_URL/access/role-matrix/$ORG_ID/permission" | jq '.'
echo -e "\n"

# Test 9: Give viewer access to Live Reports
echo "9. Give viewer access to Live Reports"
echo "PATCH /access/role-matrix/$ORG_ID/permission"
echo "Request Body: {module: 'Live Reports', role: 'viewer', has_access: true}"
echo "----------------------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Live Reports",
    "role": "viewer",
    "has_access": true
  }' \
  "$BASE_URL/access/role-matrix/$ORG_ID/permission" | jq '.'
echo -e "\n"

# Test 10: Give viewer access to Settings (this should fail as only admin can access)
echo "10. Try to give viewer access to Settings (should fail)"
echo "PATCH /access/role-matrix/$ORG_ID/permission"
echo "Request Body: {module: 'Settings', role: 'viewer', has_access: true}"
echo "----------------------------------------------------------------------"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Settings",
    "role": "viewer",
    "has_access": true
  }' \
  "$BASE_URL/access/role-matrix/$ORG_ID/permission" | jq '.'
echo -e "\n"

echo "✅ Single permission update tests completed!"
echo ""
echo "📝 Notes:"
echo "- Replace <YOUR_TOKEN> with actual JWT token from login"
echo "- Replace <ORG_ID> with actual organization ID"
echo "- Make sure the FastAPI server is running on http://127.0.0.1:8000"
echo "- Each request updates permissions for the entire module"
echo "- The API handles the exact request format you're using"
echo ""
echo "🔗 API Endpoint:"
echo "PATCH /access/role-matrix/{organization_id}/permission"
echo ""
echo "📋 Request Format:"
echo "{
  \"module\": \"Activity Log\",
  \"role\": \"viewer\",
  \"has_access\": true
}"
echo ""
echo "📊 Expected Response:"
echo "{
  \"success\": true,
  \"message\": \"Permission updated for viewer on Activity Log\",
  \"module\": \"Activity Log\",
  \"role\": \"viewer\",
  \"has_access\": true
}"
