"""
网安棋谱平台 - 主应用入口
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

from app.database import engine, Base
from app.routers import auth, users, tracks, scenarios, game_routes

# 创建数据库表
Base.metadata.create_all(bind=engine)

# 创建FastAPI应用
app = FastAPI(
    title="网安棋谱平台",
    description="基于七宗罪、八个打、RITE模型的网络安全对战平台",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # React开发服务器
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(users.router, prefix="/api/users", tags=["用户"])
app.include_router(tracks.router, prefix="/api/tracks", tags=["赛道"])
app.include_router(scenarios.router, prefix="/api/scenarios", tags=["场景"])
app.include_router(game_routes.router, prefix="/api/game", tags=["游戏"])

# 静态文件服务（如果需要）
# app.mount("/static", StaticFiles(directory="static"), name="static")

# 根路径
@app.get("/")
async def root():
    return {
        "message": "网安棋谱平台 API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# API信息
@app.get("/api")
async def api_info():
    return {
        "name": "Cyber Chess Platform API",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/auth",
            "users": "/api/users",
            "tracks": "/api/tracks",
            "scenarios": "/api/scenarios",
            "game": "/api/game"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )