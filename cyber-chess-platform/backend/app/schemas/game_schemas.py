# cyber-chess-platform/backend/app/schemas/game_schemas.py

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class GamePhaseEnum(str, Enum):
    SETUP = "setup"
    PLAYING = "playing"
    PAUSED = "paused"
    COMPLETED = "completed"

class GameSessionCreate(BaseModel):
    scenario_id: int
    attacker_id: Optional[int] = None
    defender_id: Optional[int] = None
    game_mode: str = "pvp"

class GameSessionResponse(BaseModel):
    id: int
    scenario_id: int
    current_round: int
    current_turn: str
    current_phase: str
    status: str
    trust_score: float
    risk_score: float
    incident_score: float
    loss_score: float
    
    class Config:
        orm_mode = True

class GameMoveCreate(BaseModel):
    action_type: str
    action_name: str
    target: Optional[Dict[str, Any]] = None
    parameters: Optional[Dict[str, Any]] = None

class GameStateResponse(BaseModel):
    id: int
    session_id: int
    round_number: int
    attacker_state: Dict[str, Any]
    defender_state: Dict[str, Any]
    infrastructure_state: Dict[str, Any]
    
    class Config:
        orm_mode = True