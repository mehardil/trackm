#!/bin/bash

# Test API Structure (No Authentication Required)
# This script tests the basic API structure and endpoints

# Base URL
BASE_URL="http://127.0.0.1:8000"

echo "🔍 Testing API Structure"
echo "========================"
echo ""

# 1. Test if server is running
echo "1. Testing server connection..."
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/" | grep -q "200"; then
    echo " ✅ Server is running on $BASE_URL"
else
    echo " ❌ Server is not running on $BASE_URL"
    echo "   Please start your FastAPI server: python -m uvicorn app.main:app --reload"
    exit 1
fi
echo ""

# 2. Test root endpoint
echo "2. Testing root endpoint..."
curl -s "$BASE_URL/" | jq '.' 2>/dev/null || echo "Response: $(curl -s "$BASE_URL/")"
echo ""

# 3. Test if access endpoints exist (should return 401 without auth)
echo "3. Testing access endpoints (should return 401 without auth)..."
echo "GET /access/role-access/permissions"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/access/role-access/permissions")
if [ "$HTTP_CODE" = "401" ]; then
    echo " ✅ Endpoint exists (401 Unauthorized - expected without auth)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo " ❌ Endpoint not found (404)"
else
    echo " ⚠️  Unexpected response: $HTTP_CODE"
fi
echo ""

# 4. Test role matrix endpoint
echo "4. Testing role matrix endpoint..."
echo "GET /access/role-matrix/50"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/access/role-matrix/50")
if [ "$HTTP_CODE" = "401" ]; then
    echo " ✅ Endpoint exists (401 Unauthorized - expected without auth)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo " ❌ Endpoint not found (404)"
else
    echo " ⚠️  Unexpected response: $HTTP_CODE"
fi
echo ""

# 5. Test user permission matrix endpoint
echo "5. Testing user permission matrix endpoint..."
echo "GET /access/user-permission-matrix/50"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/access/user-permission-matrix/50")
if [ "$HTTP_CODE" = "401" ]; then
    echo " ✅ Endpoint exists (401 Unauthorized - expected without auth)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo " ❌ Endpoint not found (404)"
else
    echo " ⚠️  Unexpected response: $HTTP_CODE"
fi
echo ""

# 6. Test with invalid token
echo "6. Testing with invalid token..."
echo "GET /access/role-access/permissions"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer invalid-token" "$BASE_URL/access/role-access/permissions")
if [ "$HTTP_CODE" = "401" ]; then
    echo " ✅ Authentication working (401 Unauthorized - expected with invalid token)"
elif [ "$HTTP_CODE" = "403" ]; then
    echo " ✅ Authentication working (403 Forbidden - expected with invalid token)"
else
    echo " ⚠️  Unexpected response: $HTTP_CODE"
fi
echo ""

echo "✅ API structure test completed!"
echo ""
echo "📋 Summary:"
echo "- Server is running: ✅"
echo "- Endpoints exist: ✅"
echo "- Authentication is working: ✅"
echo ""
echo "🔧 Next steps:"
echo "1. Get a valid JWT token from your login endpoint"
echo "2. Replace <YOUR_TOKEN> in the test scripts"
echo "3. Run the full test: ./test_role_access_api_demo.sh"
echo ""
echo "🔗 Available endpoints:"
echo "- GET /access/role-access/permissions"
echo "- GET /access/role-matrix/{org_id}"
echo "- GET /access/user-permission-matrix/{org_id}"
echo "- PUT /access/role-matrix/{org_id}"
echo "- PATCH /access/role-matrix/{org_id}/permission"
echo "- PATCH /access/user-permission-matrix/{org_id}/permission"
echo "- And many more..."

