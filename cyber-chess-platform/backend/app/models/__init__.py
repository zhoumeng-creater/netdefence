"""
模型模块导出
统一管理所有数据模型
"""

# 导入用户相关模型
from .user_models import User, UserRole

# 导入游戏相关模型
from .game_models import (
    # 枚举类型
    AttackMethod,
    DefenseMethod,
    GamePhase,
    
    # 主要模型
    Track,
    Scenario,
    GameSession,
    GameMove,
    GameState,
    ChessManual,
    GameTool
)

# 导出所有模型
__all__ = [
    # 用户模型
    "User",
    "UserRole",
    
    # 游戏枚举
    "AttackMethod",
    "DefenseMethod", 
    "GamePhase",
    
    # 游戏模型
    "Track",
    "Scenario",
    "GameSession",
    "GameMove",
    "GameState",
    "ChessManual",
    "GameTool"
]

# 版本信息
__version__ = "1.0.0"