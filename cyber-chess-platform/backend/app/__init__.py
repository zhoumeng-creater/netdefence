# ============================================
# 文件1: backend/app/__init__.py (主包初始化文件)
# ============================================
"""
网安棋谱平台 - 后端应用包
Cyber Chess Platform - Backend Application Package
"""

# 版本信息
__version__ = "1.0.0"
__author__ = "Cyber Chess Team"
__description__ = "基于七宗罪、八个打、RITE模型的网络安全对战平台"

# 导入核心组件
from app.database import Base, engine, get_db
from app.auth import (
    get_current_user,
    get_current_active_user,
    get_admin_user,
    create_access_token,
    create_refresh_token,
    verify_password,
    get_password_hash
)

# 应用配置
APP_CONFIG = {
    "name": "Cyber Chess Platform",
    "version": __version__,
    "description": __description__,
}

# 导出列表
__all__ = [
    "__version__",
    "Base",
    "engine",
    "get_db",
    "APP_CONFIG"
]
