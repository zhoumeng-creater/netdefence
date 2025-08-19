"""
路由模块导出
统一管理所有API路由
"""

# 导入路由模块
from . import auth
from . import users
from . import tracks
from . import scenarios
from . import game_routes

# 导出路由模块
__all__ = [
    "auth",
    "users",
    "tracks",
    "scenarios",
    "game_routes"
]

# 路由前缀配置
ROUTE_PREFIXES = {
    "auth": "/api/auth",
    "users": "/api/users",
    "tracks": "/api/tracks",
    "scenarios": "/api/scenarios",
    "game": "/api/game"
}

# 路由标签配置
ROUTE_TAGS = {
    "auth": ["认证"],
    "users": ["用户管理"],
    "tracks": ["赛道管理"],
    "scenarios": ["场景管理"],
    "game": ["游戏对战"]
}