"""
网安棋谱游戏API路由
提供游戏相关的RESTful API接口
"""
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from app.database import get_db
from app.models.game_models import (
    Track, Scenario, GameSession, GameMove,
    GameState, GameTool,
    AttackMethod, DefenseMethod
)
from app.services.game_engine import GameEngine
from app.services.chess_manual_service import ChessManualService
from app.schemas import game_schemas  # 需要创建对应的schemas
from app.auth import get_current_user


router = APIRouter(prefix="/api/game", tags=["game"])

# WebSocket连接管理器
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, game_id: int):
        await websocket.accept()
        if game_id not in self.active_connections:
            self.active_connections[game_id] = []
        self.active_connections[game_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, game_id: int):
        if game_id in self.active_connections:
            self.active_connections[game_id].remove(websocket)
            if not self.active_connections[game_id]:
                del self.active_connections[game_id]
    
    async def send_to_game(self, message: dict, game_id: int):
        if game_id in self.active_connections:
            for connection in self.active_connections[game_id]:
                await connection.send_json(message)
    
    async def send_to_player(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

manager = ConnectionManager()


# ========== 赛道和场景 API ==========

@router.get("/tracks")
async def get_tracks(
    db: Session = Depends(get_db),
    category: Optional[str] = None
):
    """获取所有赛道列表"""
    query = db.query(Track)
    if category:
        query = query.filter(Track.category == category)
    
    tracks = query.all()
    return {
        "tracks": [
            {
                "id": track.id,
                "name": track.name,
                "category": track.category,
                "description": track.description,
                "difficulty_range": track.difficulty_range,
                "sub_tracks": track.sub_tracks,
                "scenario_count": len(track.scenarios)
            }
            for track in tracks
        ]
    }


@router.get("/tracks/{track_id}")
async def get_track_detail(
    track_id: int,
    db: Session = Depends(get_db)
):
    """获取赛道详情"""
    track = db.query(Track).filter_by(id=track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    
    return {
        "id": track.id,
        "name": track.name,
        "category": track.category,
        "description": track.description,
        "difficulty_range": track.difficulty_range,
        "sub_tracks": track.sub_tracks,
        "required_knowledge": track.required_knowledge,
        "available_attacks": track.available_attacks,
        "available_defenses": track.available_defenses,
        "scenarios": [
            {
                "id": s.id,
                "name": s.name,
                "difficulty": s.difficulty,
                "description": s.scene_design
            }
            for s in track.scenarios
        ]
    }


@router.get("/scenarios/{track_id}")
async def get_scenarios(
    track_id: int,
    db: Session = Depends(get_db)
):
    """获取指定赛道的所有场景"""
    scenarios = db.query(Scenario).filter_by(track_id=track_id).all()
    
    return {
        "scenarios": [
            {
                "id": s.id,
                "name": s.name,
                "difficulty": s.difficulty,
                "background": s.background_design,
                "description": s.scene_design,
                "win_conditions": s.win_conditions
            }
            for s in scenarios
        ]
    }


@router.get("/scenario/{scenario_id}")
async def get_scenario_detail(
    scenario_id: int,
    db: Session = Depends(get_db)
):
    """获取场景详情"""
    scenario = db.query(Scenario).filter_by(id=scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    return {
        "id": scenario.id,
        "track_id": scenario.track_id,
        "name": scenario.name,
        "difficulty": scenario.difficulty,
        "background_design": scenario.background_design,
        "scene_design": scenario.scene_design,
        "target_design": scenario.target_design,
        "elements": scenario.elements,
        "attack_steps": scenario.attack_steps,
        "penetration_methods": scenario.penetration_methods,
        "defense_config": scenario.defense_config,
        "initial_infrastructure": scenario.initial_infrastructure,
        "vulnerabilities": scenario.vulnerabilities,
        "win_conditions": scenario.win_conditions
    }


# ========== 游戏会话 API ==========

@router.post("/start")
async def start_game(
    scenario_id: int,
    game_mode: str = "pvp",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """开始新游戏"""
    engine = GameEngine(db)
    
    try:
        session = engine.create_game_session(
            scenario_id=scenario_id,
            attacker_id=current_user.id if game_mode != "ai_attack" else None,
            defender_id=current_user.id if game_mode != "ai_defense" else None,
            game_mode=game_mode
        )
        
        return {
            "session_id": session.id,
            "game_mode": session.game_mode,
            "current_phase": session.current_phase,
            "current_turn": session.current_turn,
            "attacker_resources": session.attacker_resources,
            "defender_resources": session.defender_resources,
            "initial_scores": {
                "trust": session.trust_score,
                "risk": session.risk_score,
                "incident": session.incident_score,
                "loss": session.loss_score
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/session/{session_id}")
async def get_game_session(
    session_id: int,
    db: Session = Depends(get_db)
):
    """获取游戏会话状态"""
    session = db.query(GameSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # 获取最新状态
    latest_state = db.query(GameState).filter_by(
        session_id=session_id
    ).order_by(GameState.round_number.desc()).first()
    
    return {
        "session_id": session.id,
        "scenario": {
            "id": session.scenario.id,
            "name": session.scenario.name
        },
        "current_round": session.current_round,
        "current_turn": session.current_turn,
        "current_phase": session.current_phase,
        "status": session.status,
        "winner": session.winner,
        "scores": {
            "trust": session.trust_score,
            "risk": session.risk_score,
            "incident": session.incident_score,
            "loss": session.loss_score
        },
        "resources": {
            "attacker": session.attacker_resources,
            "defender": session.defender_resources
        },
        "state": {
            "infrastructure": latest_state.infrastructure_state if latest_state else {},
            "discovered_vulns": latest_state.discovered_vulns if latest_state else [],
            "active_defenses": latest_state.active_defenses if latest_state else [],
            "compromised_systems": latest_state.compromised_systems if latest_state else []
        }
    }


@router.post("/move")
async def execute_move(
    session_id: int,
    player_role: str,
    action_type: str,
    target: Dict,
    parameters: Optional[Dict] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """执行游戏动作"""
    engine = GameEngine(db)
    
    try:
        result = engine.execute_move(
            session_id=session_id,
            player_role=player_role,
            action_type=action_type,
            target=target,
            parameters=parameters
        )
        
        # 通过WebSocket广播更新
        await manager.send_to_game({
            "type": "move_executed",
            "player": player_role,
            "action": action_type,
            "result": result
        }, session_id)
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/history/{session_id}")
async def get_game_history(
    session_id: int,
    db: Session = Depends(get_db)
):
    """获取游戏历史记录"""
    moves = db.query(GameMove).filter_by(
        session_id=session_id
    ).order_by(GameMove.round_number, GameMove.executed_at).all()
    
    return {
        "moves": [
            {
                "round": move.round_number,
                "player": move.player_role,
                "action": move.action_type,
                "action_name": move.action_name,
                "target": move.target,
                "success": move.success,
                "description": move.result_description,
                "impact": move.impact_scores,
                "timestamp": move.executed_at.isoformat()
            }
            for move in moves
        ]
    }


# ========== 棋谱 API ==========

@router.post("/manual/generate/{session_id}")
async def generate_chess_manual(
    session_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """生成棋谱"""
    service = ChessManualService(db)
    
    try:
        manual = service.generate_manual(session_id)
        return {
            "manual_id": manual.id,
            "title": manual.title,
            "description": manual.description,
            "quality_rating": manual.quality_rating,
            "educational_value": manual.educational_value
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/manual/{manual_id}")
async def get_chess_manual(
    manual_id: int,
    db: Session = Depends(get_db)
):
    """获取棋谱详情"""
    service = ChessManualService(db)
    manual = service.get_manual(manual_id)
    
    if not manual:
        raise HTTPException(status_code=404, detail="Manual not found")
    
    return {
        "id": manual.id,
        "title": manual.title,
        "description": manual.description,
        "manual_data": manual.manual_data,
        "statistics": {
            "total_rounds": manual.total_rounds,
            "total_moves": manual.total_moves,
            "duration": manual.duration_seconds,
            "attack_success_rate": manual.attack_success_rate,
            "defense_effectiveness": manual.defense_effectiveness
        },
        "ratings": {
            "quality": manual.quality_rating,
            "educational": manual.educational_value
        },
        "tags": manual.tags,
        "created_at": manual.created_at.isoformat()
    }


@router.get("/manuals/search")
async def search_manuals(
    track_id: Optional[int] = None,
    scenario_id: Optional[int] = None,
    winner: Optional[str] = None,
    min_quality: Optional[int] = None,
    tags: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """搜索棋谱"""
    service = ChessManualService(db)
    
    tag_list = tags.split(",") if tags else None
    
    manuals = service.search_manuals(
        track_id=track_id,
        scenario_id=scenario_id,
        winner=winner,
        min_quality=min_quality,
        tags=tag_list,
        limit=limit
    )
    
    return {
        "manuals": [
            {
                "id": m.id,
                "title": m.title,
                "description": m.description,
                "quality_rating": m.quality_rating,
                "educational_value": m.educational_value,
                "tags": m.tags,
                "created_at": m.created_at.isoformat()
            }
            for m in manuals
        ]
    }


@router.get("/manual/replay/{manual_id}")
async def replay_manual(
    manual_id: int,
    db: Session = Depends(get_db)
):
    """获取棋谱回放数据"""
    service = ChessManualService(db)
    
    try:
        replay_data = service.replay_manual(manual_id)
        return replay_data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ========== 游戏工具 API ==========

@router.get("/tools/{tool_type}")
async def get_game_tools(
    tool_type: str,  # "attack" or "defense"
    db: Session = Depends(get_db)
):
    """获取游戏工具列表"""
    tools = db.query(GameTool).filter_by(tool_type=tool_type).all()
    
    return {
        "tools": [
            {
                "id": tool.id,
                "type": tool.tool_type,
                "category": tool.method_category,
                "name": tool.name,
                "description": tool.description,
                "icon": tool.icon,
                "cost": tool.cost,
                "cooldown": tool.cooldown,
                "success_rate": tool.success_rate,
                "effects": tool.effects
            }
            for tool in tools
        ]
    }


# ========== WebSocket 端点 ==========

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: int,
    db: Session = Depends(get_db)
):
    """WebSocket连接处理"""
    await manager.connect(websocket, session_id)
    
    try:
        # 发送初始状态
        session = db.query(GameSession).filter_by(id=session_id).first()
        if session:
            await manager.send_to_player({
                "type": "connected",
                "session_id": session_id,
                "current_turn": session.current_turn,
                "current_round": session.current_round
            }, websocket)
        
        # 处理消息
        while True:
            data = await websocket.receive_json()
            
            # 处理不同类型的消息
            if data["type"] == "move":
                engine = GameEngine(db)
                try:
                    result = engine.execute_move(
                        session_id=session_id,
                        player_role=data["player"],
                        action_type=data["action"],
                        target=data["target"],
                        parameters=data.get("parameters")
                    )
                    
                    # 广播结果
                    await manager.send_to_game({
                        "type": "move_result",
                        "player": data["player"],
                        "action": data["action"],
                        "result": result
                    }, session_id)
                    
                except Exception as e:
                    await manager.send_to_player({
                        "type": "error",
                        "message": str(e)
                    }, websocket)
            
            elif data["type"] == "chat":
                # 广播聊天消息
                await manager.send_to_game({
                    "type": "chat",
                    "player": data["player"],
                    "message": data["message"]
                }, session_id)
            
            elif data["type"] == "ping":
                await manager.send_to_player({
                    "type": "pong"
                }, websocket)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
        await manager.send_to_game({
            "type": "player_disconnected"
        }, session_id)