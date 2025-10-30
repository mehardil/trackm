from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# Role Access Schemas
class RolePermissionRequest(BaseModel):
    role: str
    permission_id: int
    has_access: bool

class UserPermissionRequest(BaseModel):
    user_id: int
    permission_id: int
    has_access: bool

class RoleAccessResponse(BaseModel):
    user_id: int
    organization_id: int
    role: str
    module: str
    code: str
    final_access: bool

class RoleAccessUpdateRequest(BaseModel):
    role: str
    permissions: List[RolePermissionRequest]

class UserAccessUpdateRequest(BaseModel):
    user_id: int
    permissions: List[UserPermissionRequest]

class RoleAccessSummary(BaseModel):
    role: str
    permissions: List[Dict[str, Any]]

class UserAccessSummary(BaseModel):
    user_id: int
    user_name: str
    user_email: str
    role: str
    permissions: List[Dict[str, Any]]

# Existing schemas (if any)
class UserCreate(BaseModel):
    username: str
    business_email: str
    password: str
    department: str
    userrole: str

class UserResponse(BaseModel):
    id: int
    username: str
    name: str
    email: str
    role: str
    department: str
    status: str
    organization_id: int
