from pydantic import BaseModel, EmailStr, constr
from typing import Optional

class UserCreate(BaseModel):
    organization_id: int
    username: constr(min_length=3, max_length=50)
    password: constr(min_length=6)
    name: Optional[str]
    email: Optional[EmailStr]
    department: Optional[str]
    role: str
    avatar_color: Optional[str]

class UserLogin(BaseModel):
    organization_id: int
    username: str
    password: str

class UserRead(BaseModel):
    id: int
    organization_id: int
    username: str
    name: Optional[str]
    email: Optional[EmailStr]
    department: Optional[str]
    role: str
    avatar_color: Optional[str]
    status: Optional[str]
    last_active: Optional[str]
    is_agent: bool

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    organization_id: Optional[int] = None
    role: Optional[str] = None 