#!/bin/bash

# Get all modules from permissions table
# This shows how to get all modules through the API

# Base URL
BASE_URL="http://127.0.0.1:8000"

# Authentication token (replace with actual token from login)
TOKEN="<YOUR_TOKEN>"

echo "🔍 Getting all modules from permissions table"
echo "============================================="
echo ""

# 1. Get all permissions (this will show all modules)
echo "1. Get all permissions (shows all modules):"
echo "GET /access/role-access/permissions"
echo "-----------------------------------"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/permissions" | jq '.[] | {id, code, module}' | sort -u
echo -e "\n"

# 2. Get unique modules only (using jq to filter)
echo "2. Get unique modules only:"
echo "GET /access/role-access/permissions | jq '.[].module' | sort -u"
echo "---------------------------------------------------------------"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/permissions" | jq -r '.[].module' | sort -u
echo -e "\n"

# 3. Get modules with permission counts
echo "3. Get modules with permission counts:"
echo "GET /access/role-access/permissions | jq 'group_by(.module) | map({module: .[0].module, count: length})'"
echo "-------------------------------------------------------------------------------------------"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/permissions" | jq 'group_by(.module) | map({module: .[0].module, count: length}) | sort_by(.count) | reverse'
echo -e "\n"

# 4. Get permissions for specific modules
echo "4. Get permissions for Dashboard module:"
echo "GET /access/role-access/permissions | jq '.[] | select(.module == \"Dashboard\")'"
echo "-------------------------------------------------------------------------------"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/permissions" | jq '.[] | select(.module == "Dashboard")'
echo -e "\n"

# 5. Get permissions for Teams module
echo "5. Get permissions for Teams module:"
echo "GET /access/role-access/permissions | jq '.[] | select(.module == \"Teams\")'"
echo "----------------------------------------------------------------------------"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/permissions" | jq '.[] | select(.module == "Teams")'
echo -e "\n"

# 6. Get permissions for Insights module
echo "6. Get permissions for Insights module:"
echo "GET /access/role-access/permissions | jq '.[] | select(.module == \"Insights\")'"
echo "-------------------------------------------------------------------------------"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/permissions" | jq '.[] | select(.module == "Insights")'
echo -e "\n"

# 7. Get all modules in a simple list
echo "7. Get all modules in a simple list:"
echo "GET /access/role-access/permissions | jq -r '.[].module' | sort -u"
echo "------------------------------------------------------------------"
curl -s -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/access/role-access/permissions" | jq -r '.[].module' | sort -u | nl
echo -e "\n"

echo "✅ All module queries completed!"
echo ""
echo "📝 Notes:"
echo "- Replace <YOUR_TOKEN> with actual JWT token from login"
echo "- Make sure the FastAPI server is running on http://127.0.0.1:8000"
echo "- Install jq for better JSON formatting: sudo apt-get install jq"
echo "- The API returns all permissions, then we filter by module"

