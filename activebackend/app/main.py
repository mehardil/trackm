import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controller import organization,team,login,user,filter,signup,access,agentdownload
from controller import categories
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(organization.router, prefix="/organization", tags=["organization"])
app.include_router(team.router, prefix="/team", tags=["team"])
app.include_router(login.router, prefix="/login", tags=["login"])
app.include_router(user.router, prefix="/user", tags=["user"])
app.include_router(filter.router, prefix="/filter", tags=["filter"])
app.include_router(signup.router, prefix="/signup", tags=["signup"])
app.include_router(access.router, prefix="/access", tags=["role-access"])
app.include_router(agentdownload.router, prefix="/downloadagent", tags=["downloadagent"])
app.include_router(categories.router, prefix="/categories", tags=["categories"])


logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s %(message)s')
@app.get("/")
def root():
    return {"message": "Welcome to FastAPI E-Commerce API"}