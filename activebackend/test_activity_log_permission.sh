#!/bin/bash

# Test Activity Log Permission Update
# This script tests the correct PATCH endpoint for single permission updates

# Base URL
BASE_URL="http://127.0.0.1:8000"

# You need to replace these with actual values
TOKEN="<YOUR_TOKEN>"
ORG_ID="50"

echo "🔄 Testing Activity Log Permission Update"
echo "========================================"
echo ""
echo "⚠️  IMPORTANT: Make sure you're using the PATCH endpoint, not PUT!"
echo "   ✅ Correct: PATCH /access/role-matrix/{org_id}/permission"
echo "   ❌ Wrong:   PUT /access/role-matrix/{org_id} (causes 'Matrix data is required' error)"
echo ""

# Test: Remove viewer access from Activity Log
echo "Testing: Remove viewer access from Activity Log"
echo "Endpoint: PATCH /access/role-matrix/$ORG_ID/permission"
echo "Request Body:"
echo '{
  "module": "Activity Log",
  "role": "viewer",
  "has_access": false
}'
echo ""
echo "Making request..."
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
echo "✅ Test completed!"
echo ""
echo "📝 Notes:"
echo "- Make sure to replace <YOUR_TOKEN> with actual JWT token"
echo "- Make sure to replace ORG_ID with actual organization ID"
echo "- Make sure the FastAPI server is running on http://127.0.0.1:8000"
echo "- This uses the PATCH endpoint, not PUT"
echo ""
echo "🔗 Correct API Endpoint:"
echo "PATCH /access/role-matrix/{organization_id}/permission"
echo ""
echo "❌ Wrong endpoint (causes 'Matrix data is required' error):"
echo "PUT /access/role-matrix/{organization_id}"
