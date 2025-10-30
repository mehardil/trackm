import logging
from fastapi import HTTPException,Request
import jwt
from config import config

def token_return_values(token):
    """in this function we decode token"""
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token_payload = decode_token(token.split(" ")[1])
    print(token_payload ,"token_payload")
    organization_id = token_payload.get("org_id")
    user_id = token_payload.get("user_id")
    role =  token_payload.get("role")
    return user_id,organization_id,role


def decode_token(token: str):
    try:
        payload = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
