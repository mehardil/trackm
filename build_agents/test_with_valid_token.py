#!/usr/bin/env python3
"""
Test script with a valid token for testing purposes
"""

import sys
import os
import time
import jwt
#from build_production_msi import ProductionMSIBuilder

def create_test_token():
    """Create a test token that's valid for 24 hours"""
    payload = {
        'user_id': 119,
        'role': 'admin',
        'org_id': 50,
        'exp': int(time.time()) + 86400  # 24 hours from now
    }
    
    # Use a simple secret for testing
    secret = 'mehardil123'
    token = jwt.encode(payload, secret, algorithm='HS256')
    print(token)
    return token

def test_build():
    """Test the MSI build process with a valid token"""
    
    print("Creating test token...")
    token = create_test_token()
    print(f"Test token: {token[:50]}...")
    
    print("\nTesting MSI build process...")
    
    try:
        builder = ProductionMSIBuilder()
        
        # Test token validation
        print("1. Validating token...")
        payload = builder.validate_token(token)
        print(f"   ✓ Token valid for org {payload['org_id']}, user {payload['user_id']}")
        
        # Test executable build
        print("2. Building executable...")
        if builder.build_executable():
            print("   ✓ Executable built successfully")
        else:
            print("   ✗ Executable build failed")
            return False
        
        # Test MSI build
        print("3. Building MSI...")
        if builder.build_msi(token, payload['org_id'], "TestAgent.msi"):
            print("   ✓ MSI built successfully")
        else:
            print("   ✗ MSI build failed")
            return False
        
        print("\n✅ All tests passed!")
        print(f"MSI file created: dist/TestAgent.msi")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_build()
    sys.exit(0 if success else 1)
