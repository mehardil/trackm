from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import User
from database import get_db
from schemas import UserCreate, UserLogin, UserRead, Token
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from routers.organizations import router as organizations_router
from routers.users import router as users_router
from routers.agents import router as agents_router
from routers.groups import router as groups_router
from routers.screenshots import router as screenshots_router
from routers.app_website_rules import router as rules_router
from routers.activities import router as activities_router
from ws_agent_status import router as ws_agent_status_router
from sqlalchemy import and_

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(organizations_router)
app.include_router(users_router)
app.include_router(agents_router)
app.include_router(groups_router)
app.include_router(screenshots_router)
app.include_router(rules_router)
app.include_router(activities_router)
app.include_router(ws_agent_status_router)

@app.get("/")
def read_root():
    return {"message": "TrackM FastAPI backend is running."}

@app.post("/auth/register", response_model=UserRead)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if username exists in org
    result = await db.execute(select(User).where(User.organization_id == user.organization_id, User.username == user.username))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=409, detail="Username already exists in this organization")
    hashed_pw = get_password_hash(user.password)
    db_user = User(
        organization_id=user.organization_id,
        username=user.username,
        password=hashed_pw,
        name=user.name,
        email=user.email,
        department=user.department,
        role=user.role,
        avatar_color=user.avatar_color,
        is_agent=(user.role == "agent")
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@app.post("/auth/login", response_model=Token)
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.organization_id == user.organization_id, User.username == user.username))
    db_user = result.scalars().first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    token = create_access_token({
        "user_id": db_user.id,
        "organization_id": db_user.organization_id,
        "role": db_user.role
    })
    return {"access_token": token, "token_type": "bearer"}

@app.post("/auth/agent-login")
async def agent_login(
    data: dict = Body(...),
    db: AsyncSession = Depends(get_db)
):
    organization_id = data.get("organization_id")
    agent_id = data.get("agent_id")
    # Allow agent_id=0 for new agents
    if not organization_id or agent_id is None:
        raise HTTPException(status_code=400, detail="organization_id and agent_id required")
    # Try to find an agent user for this org/agent_id
    result = await db.execute(
        select(User).where(
            and_(
                User.organization_id == organization_id,
                User.username == f"agent_{agent_id}",
                User.role == "agent"
            )
        )
    )
    user = result.scalars().first()
    if not user:
        # Create the agent user
        user = User(
            organization_id=organization_id,
            username=f"agent_{agent_id}",
            password="",  # No password
            role="agent"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    # Issue JWT
    token = create_access_token({
        "user_id": user.id,
        "organization_id": user.organization_id,
        "agent_id": agent_id,
        "role": user.role
    })
    print("!!! AGENT LOGIN PATCHED !!!", user.id)
    return {"access_token": token, "token_type": "bearer", "user_id": user.id}

@app.get("/auth/me", response_model=UserRead)
async def read_me(current_user: User = Depends(get_current_user)):
    return current_user 