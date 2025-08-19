"""
网安棋谱游戏数据模型
基于七宗罪、八个打、RITE模型等概念
"""
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from enum import Enum
from app.database import Base


class AttackMethod(str, Enum):
    """七宗罪 - 攻击方法枚举"""
    PRANK = "prank"  # 恶作剧
    EXPLOIT = "exploit"  # 钻空子
    THEFT = "theft"  # 偷东西
    DESTROY = "destroy"  # 搞破坏
    RANSOM = "ransom"  # 整绑架
    PHISH = "phish"  # 钓鱼虾
    CHAOS = "chaos"  # 搅浑水


class DefenseMethod(str, Enum):
    """八个打 - 防御方法枚举"""
    # 基础防御
    PATCH = "patch"  # 打补丁
    FIREWALL = "firewall"  # 打苍蝇
    MONITOR = "monitor"  # 打地鼠
    VACCINE = "vaccine"  # 打疫苗
    # 先进防御
    AMBUSH = "ambush"  # 打埋伏
    DECOY = "decoy"  # 打边鼓
    GUERRILLA = "guerrilla"  # 打游击
    TAICHI = "taichi"  # 打太极


class GamePhase(str, Enum):
    """游戏阶段枚举"""
    SETUP = "setup"  # 初始化
    RECON = "recon"  # 侦察阶段
    COMBAT = "combat"  # 对抗阶段
    RESOLUTION = "resolution"  # 结算阶段


class Track(Base):
    """赛道模型 - 基于文档的9大赛道"""
    __tablename__ = "tracks"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # 如"网站安全"
    category = Column(String(50), nullable=False)  # 大类
    description = Column(Text)
    difficulty_range = Column(String(20))  # "★★ - ★★★★"
    
    # 子赛道配置
    sub_tracks = Column(JSON, default=list)
    # 所需知识点
    required_knowledge = Column(JSON, default=list)
    # 可用攻击方法（七宗罪）
    available_attacks = Column(JSON, default=list)
    # 可用防御方法（八个打）
    available_defenses = Column(JSON, default=list)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    scenarios = relationship("Scenario", back_populates="track", cascade="all, delete-orphan")


class Scenario(Base):
    """场景模型 - 基于棋谱模板"""
    __tablename__ = "scenarios"
    
    id = Column(Integer, primary_key=True, index=True)
    track_id = Column(Integer, ForeignKey("tracks.id"), nullable=False)
    name = Column(String(200), nullable=False)
    difficulty = Column(Integer, default=2)  # 1-5星
    
    # 场景设计（基于模板）
    background_design = Column(Text)  # 背景设计
    scene_design = Column(Text)  # 场景设计
    target_design = Column(JSON)  # 目标设计
    elements = Column(JSON)  # 要素设计
    
    # 攻防配置
    attack_steps = Column(JSON)  # 攻击步骤（5步）
    penetration_methods = Column(JSON)  # 渗透方法
    defense_config = Column(JSON)  # 防御配置
    
    # 初始环境配置
    initial_infrastructure = Column(JSON)  # 基础设施
    vulnerabilities = Column(JSON)  # 漏洞配置
    win_conditions = Column(JSON)  # 胜利条件
    
    # 评分权重（RITE模型）
    trust_weight = Column(Float, default=0.25)
    risk_weight = Column(Float, default=0.25)
    incident_weight = Column(Float, default=0.25)
    loss_weight = Column(Float, default=0.25)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    track = relationship("Track", back_populates="scenarios")
    game_sessions = relationship("GameSession", back_populates="scenario")


class GameSession(Base):
    """游戏会话模型"""
    __tablename__ = "game_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(Integer, ForeignKey("scenarios.id"), nullable=False)
    
    # 玩家信息
    attacker_id = Column(Integer, ForeignKey("users.id"))
    defender_id = Column(Integer, ForeignKey("users.id"))
    
    # 游戏模式
    game_mode = Column(String(20), default="pvp")  # pvp, pve, simulation
    
    # 游戏状态
    current_phase = Column(SQLEnum(GamePhase), default=GamePhase.SETUP)
    current_round = Column(Integer, default=0)
    current_turn = Column(String(20))  # "attacker" or "defender"
    
    # 资源管理
    attacker_resources = Column(JSON, default={"action_points": 10, "tools": []})
    defender_resources = Column(JSON, default={"action_points": 10, "tools": []})
    
    # RITE评分（0-100）
    trust_score = Column(Float, default=50.0)  # 零信任
    risk_score = Column(Float, default=50.0)  # 风险归零
    incident_score = Column(Float, default=100.0)  # 零事故
    loss_score = Column(Float, default=100.0)  # 零损失
    
    # 游戏结果
    status = Column(String(20), default="active")  # active, completed, abandoned
    winner = Column(String(20))  # "attacker", "defender", "draw"
    final_score = Column(JSON)  # 最终得分详情
    
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True))
    
    # 关系
    scenario = relationship("Scenario", back_populates="game_sessions")
    moves = relationship("GameMove", back_populates="session", cascade="all, delete-orphan")
    states = relationship("GameState", back_populates="session", cascade="all, delete-orphan")


class GameMove(Base):
    """游戏移动/动作记录"""
    __tablename__ = "game_moves"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("game_sessions.id"), nullable=False)
    
    round_number = Column(Integer, nullable=False)
    player_role = Column(String(20), nullable=False)  # "attacker" or "defender"
    player_id = Column(Integer, ForeignKey("users.id"))
    
    # 动作信息
    action_type = Column(String(50), nullable=False)  # AttackMethod or DefenseMethod
    action_name = Column(String(100))
    target = Column(JSON)  # 目标系统/组件
    parameters = Column(JSON)  # 动作参数
    
    # 动作消耗
    action_cost = Column(Integer, default=1)
    
    # 结果
    success = Column(Boolean, default=False)
    result_description = Column(Text)
    impact_scores = Column(JSON)  # 对RITE分数的影响
    
    # 状态变化
    state_changes = Column(JSON)  # 环境状态变化
    
    executed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    session = relationship("GameSession", back_populates="moves")


class GameState(Base):
    """游戏状态快照"""
    __tablename__ = "game_states"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("game_sessions.id"), nullable=False)
    round_number = Column(Integer, nullable=False)
    
    # 攻防双方状态
    attacker_state = Column(JSON)  # {methods_used: [], tools_available: [], progress: {}}
    defender_state = Column(JSON)  # {defenses_active: [], tools_available: [], health: {}}
    
    # 基础设施状态
    infrastructure_state = Column(JSON)  # 各系统组件状态
    discovered_vulns = Column(JSON)  # 已发现的漏洞
    active_defenses = Column(JSON)  # 激活的防御措施
    compromised_systems = Column(JSON)  # 已被攻陷的系统
    
    # RITE评分快照
    trust_score = Column(Float)
    risk_score = Column(Float)
    incident_score = Column(Float)
    loss_score = Column(Float)
    overall_score = Column(Float)  # 综合得分
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    session = relationship("GameSession", back_populates="states")


class ChessManual(Base):
    """棋谱记录"""
    __tablename__ = "chess_manuals"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("game_sessions.id"), unique=True)
    
    # 元数据
    title = Column(String(200))
    description = Column(Text)
    
    # 棋谱内容（完整的JSON格式）
    manual_data = Column(JSON)  # 包含完整的对战记录
    
    # 统计信息
    total_rounds = Column(Integer)
    total_moves = Column(Integer)
    duration_seconds = Column(Integer)
    
    # 关键指标
    attack_success_rate = Column(Float)
    defense_effectiveness = Column(Float)
    
    # 标签（用于搜索和分类）
    tags = Column(JSON, default=list)
    
    # 评级
    quality_rating = Column(Integer)  # 1-5星
    educational_value = Column(Integer)  # 1-5星
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    session = relationship("GameSession", backref="chess_manual", uselist=False)


class GameTool(Base):
    """游戏工具/技能配置"""
    __tablename__ = "game_tools"
    
    id = Column(Integer, primary_key=True, index=True)
    tool_type = Column(String(20))  # "attack" or "defense"
    method_category = Column(String(50))  # AttackMethod or DefenseMethod
    
    name = Column(String(100), nullable=False)
    description = Column(Text)
    icon = Column(String(50))  # emoji或图标类名
    
    # 工具属性
    cost = Column(Integer, default=1)  # 行动点消耗
    cooldown = Column(Integer, default=0)  # 冷却回合数
    success_rate = Column(Float, default=0.7)  # 基础成功率
    
    # 效果配置
    effects = Column(JSON)  # 工具效果
    requirements = Column(JSON)  # 使用前提条件
    counters = Column(JSON)  # 可被哪些防御方法克制
    
    # 适用场景
    applicable_scenarios = Column(JSON, default=list)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
