"""
服务层模块导出
统一管理所有业务服务
"""

# 导入服务类
from .game_engine import GameEngine
from .chess_manual_service import ChessManualService

# 导入其他服务（如果有）
# from .auth_service import AuthService
# from .user_service import UserService

# 导出所有服务
__all__ = [
    "GameEngine",
    "ChessManualService",
    # "AuthService",
    # "UserService"
]

# 服务单例实例（可选）
_game_engine_instance = None
_chess_manual_service_instance = None


def get_game_engine(db):
    """
    获取游戏引擎实例（单例模式）
    
    Args:
        db: 数据库会话
        
    Returns:
        GameEngine: 游戏引擎实例
    """
    global _game_engine_instance
    if _game_engine_instance is None:
        _game_engine_instance = GameEngine(db)
    else:
        # 更新数据库会话
        _game_engine_instance.db = db
    return _game_engine_instance


def get_chess_manual_service(db):
    """
    获取棋谱服务实例（单例模式）
    
    Args:
        db: 数据库会话
        
    Returns:
        ChessManualService: 棋谱服务实例
    """
    global _chess_manual_service_instance
    if _chess_manual_service_instance is None:
        _chess_manual_service_instance = ChessManualService(db)
    else:
        # 更新数据库会话
        _chess_manual_service_instance.db = db
    return _chess_manual_service_instance


# 服务配置
SERVICE_CONFIG = {
    "game_engine": {
        "max_rounds": 30,  # 最大回合数
        "initial_action_points": 10,  # 初始行动点
        "action_point_recovery": 5,  # 每回合恢复的行动点
    },
    "chess_manual": {
        "max_search_results": 100,  # 最大搜索结果数
        "manual_retention_days": 365,  # 棋谱保留天数
    }
}