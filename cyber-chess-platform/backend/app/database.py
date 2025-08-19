"""
数据库配置和连接管理
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 数据库配置
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./cyber_chess.db"  # 默认使用SQLite
)

# PostgreSQL示例：
# DATABASE_URL = "postgresql://user:password@localhost/cyber_chess_db"

# MySQL示例：
DATABASE_URL = "mysql+pymysql://root:123456@localhost/cyber_chess_db"

# 创建数据库引擎
if DATABASE_URL.startswith("sqlite"):
    # SQLite需要特殊配置
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}  # 仅SQLite需要
    )
else:
    engine = create_engine(DATABASE_URL)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基类
Base = declarative_base()

# 依赖注入 - 获取数据库会话
def get_db():
    """
    获取数据库会话的依赖函数
    在每个请求中使用，请求结束后自动关闭
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 数据库初始化函数
def init_db():
    """
    初始化数据库，创建所有表
    """
    # 导入所有模型，确保它们被Base.metadata识别
    from app.models import user_models
    from app.models import game_models
    
    # 创建所有表
    Base.metadata.create_all(bind=engine)
    print("数据库表创建完成")

# 数据库重置函数（仅用于开发）
def reset_db():
    """
    重置数据库（危险操作，仅用于开发环境）
    """
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("数据库已重置")

# 测试数据库连接
def test_connection():
    """
    测试数据库连接
    """
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        print("数据库连接成功")
        return True
    except Exception as e:
        print(f"数据库连接失败: {e}")
        return False

if __name__ == "__main__":
    # 如果直接运行此文件，则初始化数据库
    test_connection()
    init_db()