#!/bin/bash

# Test Fixed Permission Update
# This script tests both the PATCH endpoint (correct) and shows the error for PUT endpoint

# Base URL
BASE_URL="http://127.0.0.1:8000"

# You need to replace these with actual values
TOKEN="<YOUR_TOKEN>"
ORG_ID="50"

echo "🔄 Testing Fixed Permission Update"
echo "================================="
echo ""

echo "⚠️  IMPORTANT: The 'section' error has been fixed!"
echo "   The role_matrix_service now handles different data structures properly."
echo ""

# Test 1: Correct PATCH endpoint (should work)
echo "1️⃣ Testing PATCH endpoint (CORRECT - should work):"
echo "   PATCH /access/role-matrix/$ORG_ID/permission"
echo "   Request Body:"
echo '   {
     "module": "Activity Log",
     "role": "viewer",
     "has_access": false
   }'
echo ""
echo "   Making request..."
echo "   ----------------------------------------------------------------------"

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

# Test 2: Wrong PUT endpoint (should now give better error message)
echo "2️⃣ Testing PUT endpoint (WRONG - should give helpful error):"
echo "   PUT /access/role-matrix/$ORG_ID"
echo "   Request Body:"
echo '   {
     "module": "Activity Log",
     "role": "viewer",
     "has_access": false
   }'
echo ""
echo "   Making request..."
echo "   ----------------------------------------------------------------------"

curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Activity Log",
    "role": "viewer",
    "has_access": false
  }' \
  "$BASE_URL/access/role-matrix/$ORG_ID" | jq '.'

echo -e "\n"
echo "✅ Tests completed!"
echo ""
echo "📝 What was fixed:"
echo "   ✅ Added better error handling for 'section' key missing"
echo "   ✅ Added support for 'module' key as alternative to 'section'"
echo "   ✅ Added validation for matrix_data structure"
echo "   ✅ Added detailed logging for debugging"
echo "   ✅ Improved error messages to guide users to correct endpoint"
echo ""
echo "🔗 Correct API Endpoint:"
echo "   PATCH /access/role-matrix/{organization_id}/permission"
echo ""
echo "❌ Wrong endpoint (now gives helpful error):"
echo "   PUT /access/role-matrix/{organization_id}"

















