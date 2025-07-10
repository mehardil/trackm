from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controller import organization,team,login

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
@app.get("/")
def root():
    return {"message": "Welcome to FastAPI E-Commerce API"}