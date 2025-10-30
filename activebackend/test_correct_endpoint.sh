#!/bin/bash

# Test Correct Endpoint
# This script shows the correct way to call the API

# Base URL
BASE_URL="http://127.0.0.1:8000"

# You need to replace these with actual values
TOKEN="<YOUR_TOKEN>"
ORG_ID="50"

echo "🔄 Testing Correct Endpoint Usage"
echo "================================="
echo ""

echo "⚠️  ISSUE IDENTIFIED:"
echo "   From the logs, you're using: PUT /access//role-matrix/50/permission"
echo "   This is WRONG because:"
echo "   1. You're using PUT instead of PATCH"
echo "   2. There's a double slash in the URL"
echo ""

echo "✅ CORRECT Usage:"
echo "   Method: PATCH (not PUT)"
echo "   URL: /access/role-matrix/50/permission (no double slash)"
echo ""

# Test 1: Correct PATCH endpoint
echo "1️⃣ Testing CORRECT PATCH endpoint:"
echo "   Method: PATCH"
echo "   URL: $BASE_URL/access/role-matrix/$ORG_ID/permission"
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

# Test 2: Show what NOT to do
echo "2️⃣ What NOT to do (this causes 404):"
echo "   ❌ Method: PUT (should be PATCH)"
echo "   ❌ URL: /access//role-matrix/50/permission (double slash)"
echo ""

echo "✅ Summary:"
echo "   - Use PATCH method, not PUT"
echo "   - URL should be: /access/role-matrix/{org_id}/permission"
echo "   - No double slashes in the URL"
echo "   - Make sure you have a valid token"
echo ""
echo "🔗 Available Endpoints:"
echo "   ✅ PATCH /access/role-matrix/{org_id}/permission (single permission)"
echo "   ✅ PUT /access/role-matrix/{org_id} (full matrix update)"
echo "   ✅ GET /access/role-matrix/{org_id} (get current matrix)"
