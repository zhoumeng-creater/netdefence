"""
网安棋谱游戏引擎
处理游戏核心逻辑、回合制系统、攻防计算等
"""
from typing import Dict, List, Optional, Tuple, Any
from sqlalchemy.orm import Session
from datetime import datetime
import random
import json

from app.models.game_models import (
    GameSession, GameMove, GameState, Scenario,
    AttackMethod, DefenseMethod, GamePhase, GameTool
)


class GameEngine:
    """游戏引擎核心类"""
    
    def __init__(self, db: Session):
        self.db = db
        self.action_handlers = self._init_action_handlers()
        
    def _init_action_handlers(self) -> Dict:
        """初始化动作处理器"""
        return {
            # 七宗罪 - 攻击动作
            AttackMethod.PRANK: self._handle_prank_attack,
            AttackMethod.EXPLOIT: self._handle_exploit_attack,
            AttackMethod.THEFT: self._handle_theft_attack,
            AttackMethod.DESTROY: self._handle_destroy_attack,
            AttackMethod.RANSOM: self._handle_ransom_attack,
            AttackMethod.PHISH: self._handle_phish_attack,
            AttackMethod.CHAOS: self._handle_chaos_attack,
            
            # 八个打 - 防御动作
            DefenseMethod.PATCH: self._handle_patch_defense,
            DefenseMethod.FIREWALL: self._handle_firewall_defense,
            DefenseMethod.MONITOR: self._handle_monitor_defense,
            DefenseMethod.VACCINE: self._handle_vaccine_defense,
            DefenseMethod.AMBUSH: self._handle_ambush_defense,
            DefenseMethod.DECOY: self._handle_decoy_defense,
            DefenseMethod.GUERRILLA: self._handle_guerrilla_defense,
            DefenseMethod.TAICHI: self._handle_taichi_defense,
        }
    
    def create_game_session(
        self,
        scenario_id: int,
        attacker_id: Optional[int] = None,
        defender_id: Optional[int] = None,
        game_mode: str = "pvp"
    ) -> GameSession:
        """创建新的游戏会话"""
        scenario = self.db.query(Scenario).filter_by(id=scenario_id).first()
        if not scenario:
            raise ValueError(f"Scenario {scenario_id} not found")
        
        # 创建游戏会话
        session = GameSession(
            scenario_id=scenario_id,
            attacker_id=attacker_id,
            defender_id=defender_id,
            game_mode=game_mode,
            current_phase=GamePhase.SETUP,
            current_round=1,
            current_turn="attacker",
            attacker_resources={
                "action_points": 10,
                "tools": self._get_initial_tools("attacker", scenario)
            },
            defender_resources={
                "action_points": 10,
                "tools": self._get_initial_tools("defender", scenario)
            }
        )
        
        self.db.add(session)
        self.db.commit()
        
        # 创建初始状态
        self._create_initial_state(session, scenario)
        
        return session
    
    def _get_initial_tools(self, role: str, scenario: Scenario) -> List[str]:
        """获取初始工具列表"""
        if role == "attacker":
            # 基于场景的可用攻击方法
            methods = scenario.penetration_methods or []
            return methods[:3]  # 初始给3个工具
        else:
            # 基于场景的防御配置
            defenses = scenario.defense_config or {}
            return defenses.get("initial_tools", ["patch", "firewall", "monitor"])
    
    def _create_initial_state(self, session: GameSession, scenario: Scenario):
        """创建初始游戏状态"""
        initial_state = GameState(
            session_id=session.id,
            round_number=0,
            attacker_state={
                "methods_used": [],
                "tools_available": session.attacker_resources["tools"],
                "progress": {"recon": 0, "exploit": 0, "control": 0}
            },
            defender_state={
                "defenses_active": [],
                "tools_available": session.defender_resources["tools"],
                "health": {"integrity": 100, "availability": 100, "confidentiality": 100}
            },
            infrastructure_state=scenario.initial_infrastructure or {},
            discovered_vulns=[],
            active_defenses=[],
            compromised_systems=[],
            trust_score=50.0,
            risk_score=50.0,
            incident_score=100.0,
            loss_score=100.0,
            overall_score=75.0
        )
        
        self.db.add(initial_state)
        self.db.commit()
    
    def execute_move(
        self,
        session_id: int,
        player_role: str,
        action_type: str,
        target: Dict,
        parameters: Optional[Dict] = None
    ) -> Dict:
        """执行游戏动作"""
        session = self.db.query(GameSession).filter_by(id=session_id).first()
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        # 验证是否轮到该玩家
        if session.current_turn != player_role:
            raise ValueError(f"Not {player_role}'s turn")
        
        # 获取当前状态
        current_state = self._get_current_state(session)
        
        # 检查资源
        resources = session.attacker_resources if player_role == "attacker" else session.defender_resources
        action_cost = self._calculate_action_cost(action_type, parameters)
        
        if resources["action_points"] < action_cost:
            raise ValueError("Insufficient action points")
        
        # 执行动作
        handler = self.action_handlers.get(action_type)
        if not handler:
            raise ValueError(f"Unknown action type: {action_type}")
        
        result = handler(session, current_state, target, parameters)
        
        # 记录移动
        move = GameMove(
            session_id=session.id,
            round_number=session.current_round,
            player_role=player_role,
            action_type=action_type,
            action_name=result.get("action_name"),
            target=target,
            parameters=parameters,
            action_cost=action_cost,
            success=result.get("success", False),
            result_description=result.get("description"),
            impact_scores=result.get("impact_scores"),
            state_changes=result.get("state_changes")
        )
        
        self.db.add(move)
        
        # 更新资源
        resources["action_points"] -= action_cost
        
        # 更新RITE分数
        self._update_rite_scores(session, result.get("impact_scores", {}))
        
        # 创建新状态快照
        self._create_state_snapshot(session, result.get("state_changes", {}))
        
        # 切换回合
        self._advance_turn(session)
        
        self.db.commit()
        
        return {
            "success": result.get("success"),
            "description": result.get("description"),
            "state_changes": result.get("state_changes"),
            "current_scores": self._get_current_scores(session),
            "next_turn": session.current_turn,
            "game_status": self._check_win_conditions(session)
        }
    
    def _calculate_action_cost(self, action_type: str, parameters: Optional[Dict]) -> int:
        """计算动作消耗"""
        base_costs = {
            # 攻击动作消耗
            AttackMethod.PRANK: 2,
            AttackMethod.EXPLOIT: 3,
            AttackMethod.THEFT: 2,
            AttackMethod.DESTROY: 4,
            AttackMethod.RANSOM: 3,
            AttackMethod.PHISH: 2,
            AttackMethod.CHAOS: 3,
            
            # 防御动作消耗
            DefenseMethod.PATCH: 1,
            DefenseMethod.FIREWALL: 2,
            DefenseMethod.MONITOR: 2,
            DefenseMethod.VACCINE: 3,
            DefenseMethod.AMBUSH: 3,
            DefenseMethod.DECOY: 2,
            DefenseMethod.GUERRILLA: 3,
            DefenseMethod.TAICHI: 4,
        }
        
        base_cost = base_costs.get(action_type, 1)
        
        # 根据参数调整消耗
        if parameters and parameters.get("enhanced"):
            base_cost += 1
        
        return base_cost
    
    def _update_rite_scores(self, session: GameSession, impact_scores: Dict):
        """更新RITE评分"""
        if "trust" in impact_scores:
            session.trust_score = max(0, min(100, session.trust_score + impact_scores["trust"]))
        if "risk" in impact_scores:
            session.risk_score = max(0, min(100, session.risk_score + impact_scores["risk"]))
        if "incident" in impact_scores:
            session.incident_score = max(0, min(100, session.incident_score + impact_scores["incident"]))
        if "loss" in impact_scores:
            session.loss_score = max(0, min(100, session.loss_score + impact_scores["loss"]))
    
    def _get_current_scores(self, session: GameSession) -> Dict:
        """获取当前RITE分数"""
        return {
            "trust": session.trust_score,
            "risk": session.risk_score,
            "incident": session.incident_score,
            "loss": session.loss_score,
            "overall": (session.trust_score + session.risk_score + 
                       session.incident_score + session.loss_score) / 4
        }
    
    def _check_win_conditions(self, session: GameSession) -> Dict:
        """检查胜利条件"""
        scenario = session.scenario
        win_conditions = scenario.win_conditions or {}
        
        # 检查攻击方胜利条件
        attacker_wins = win_conditions.get("attacker", [])
        for condition in attacker_wins:
            if self._evaluate_condition(session, condition):
                session.status = "completed"
                session.winner = "attacker"
                session.ended_at = datetime.utcnow()
                return {"game_over": True, "winner": "attacker", "reason": condition}
        
        # 检查防御方胜利条件
        defender_wins = win_conditions.get("defender", [])
        for condition in defender_wins:
            if self._evaluate_condition(session, condition):
                session.status = "completed"
                session.winner = "defender"
                session.ended_at = datetime.utcnow()
                return {"game_over": True, "winner": "defender", "reason": condition}
        
        # 检查平局条件
        if session.current_round > 20:  # 超过20回合
            session.status = "completed"
            session.winner = "draw"
            session.ended_at = datetime.utcnow()
            return {"game_over": True, "winner": "draw", "reason": "Round limit reached"}
        
        return {"game_over": False}
    
    def _evaluate_condition(self, session: GameSession, condition: str) -> bool:
        """评估胜利条件"""
        # 简化的条件评估逻辑
        if "data_stolen" in condition:
            return session.loss_score < 30
        elif "system_secured" in condition:
            return session.incident_score > 80
        elif "attacker_traced" in condition:
            return session.trust_score > 80
        # 更多条件...
        return False
    
    def _advance_turn(self, session: GameSession):
        """推进回合"""
        if session.current_turn == "defender":
            # 防御方回合结束，进入下一轮
            session.current_round += 1
            session.current_turn = "attacker"
            
            # 恢复部分行动点
            session.attacker_resources["action_points"] = min(
                10, session.attacker_resources["action_points"] + 5
            )
            session.defender_resources["action_points"] = min(
                10, session.defender_resources["action_points"] + 5
            )
        else:
            # 切换到防御方
            session.current_turn = "defender"
    
    def _get_current_state(self, session: GameSession) -> GameState:
        """获取当前游戏状态"""
        return self.db.query(GameState).filter_by(
            session_id=session.id
        ).order_by(GameState.round_number.desc()).first()
    
    def _create_state_snapshot(self, session: GameSession, state_changes: Dict):
        """创建状态快照"""
        current_state = self._get_current_state(session)
        
        # 合并状态变化
        new_state_data = {
            "infrastructure_state": current_state.infrastructure_state.copy(),
            "discovered_vulns": current_state.discovered_vulns.copy(),
            "active_defenses": current_state.active_defenses.copy(),
            "compromised_systems": current_state.compromised_systems.copy(),
        }
        
        # 应用变化
        if "infrastructure" in state_changes:
            new_state_data["infrastructure_state"].update(state_changes["infrastructure"])
        if "vulns_discovered" in state_changes:
            new_state_data["discovered_vulns"].extend(state_changes["vulns_discovered"])
        if "defenses_added" in state_changes:
            new_state_data["active_defenses"].extend(state_changes["defenses_added"])
        if "systems_compromised" in state_changes:
            new_state_data["compromised_systems"].extend(state_changes["systems_compromised"])
        
        new_state = GameState(
            session_id=session.id,
            round_number=session.current_round,
            attacker_state=current_state.attacker_state,
            defender_state=current_state.defender_state,
            infrastructure_state=new_state_data["infrastructure_state"],
            discovered_vulns=new_state_data["discovered_vulns"],
            active_defenses=new_state_data["active_defenses"],
            compromised_systems=new_state_data["compromised_systems"],
            trust_score=session.trust_score,
            risk_score=session.risk_score,
            incident_score=session.incident_score,
            loss_score=session.loss_score,
            overall_score=self._get_current_scores(session)["overall"]
        )
        
        self.db.add(new_state)
    
    # ========== 攻击动作处理器 ==========
    
    def _handle_prank_attack(self, session, state, target, params) -> Dict:
        """处理恶作剧攻击"""
        success_rate = 0.6
        success = random.random() < success_rate
        
        if success:
            return {
                "success": True,
                "action_name": "恶作剧病毒投放",
                "description": f"成功向{target.get('name', '目标系统')}投放恶作剧病毒",
                "impact_scores": {"incident": -10, "trust": -5},
                "state_changes": {
                    "infrastructure": {target.get("id", "system_1"): "infected"},
                    "systems_compromised": [target.get("id")]
                }
            }
        return {
            "success": False,
            "action_name": "恶作剧病毒投放",
            "description": "病毒投放失败，被防御系统拦截",
            "impact_scores": {"trust": 5},
            "state_changes": {}
        }
    
    def _handle_exploit_attack(self, session, state, target, params) -> Dict:
        """处理漏洞利用攻击"""
        vuln_type = params.get("vuln_type", "sql_injection") if params else "sql_injection"
        
        # 检查是否有相应防御
        has_defense = any(d for d in state.active_defenses if vuln_type in d.get("protects", []))
        success_rate = 0.3 if has_defense else 0.8
        success = random.random() < success_rate
        
        if success:
            return {
                "success": True,
                "action_name": f"漏洞利用 - {vuln_type}",
                "description": f"成功利用{target.get('name', '目标')}的{vuln_type}漏洞",
                "impact_scores": {"risk": -15, "incident": -20},
                "state_changes": {
                    "vulns_discovered": [{"target": target.get("id"), "type": vuln_type}],
                    "infrastructure": {target.get("id"): "compromised"}
                }
            }
        return {
            "success": False,
            "action_name": f"漏洞利用 - {vuln_type}",
            "description": "漏洞利用失败，目标已修复或有防护",
            "impact_scores": {"risk": 10},
            "state_changes": {}
        }
    
    def _handle_theft_attack(self, session, state, target, params) -> Dict:
        """处理数据窃取攻击"""
        data_type = params.get("data_type", "user_data") if params else "user_data"
        
        # 需要先攻陷系统
        is_compromised = target.get("id") in [s for s in state.compromised_systems]
        success_rate = 0.7 if is_compromised else 0.2
        success = random.random() < success_rate
        
        if success:
            return {
                "success": True,
                "action_name": f"数据窃取 - {data_type}",
                "description": f"成功窃取{target.get('name')}的{data_type}",
                "impact_scores": {"loss": -25, "trust": -15},
                "state_changes": {
                    "data_stolen": [{"target": target.get("id"), "type": data_type}]
                }
            }
        return {
            "success": False,
            "action_name": f"数据窃取 - {data_type}",
            "description": "数据窃取失败，访问被拒绝",
            "impact_scores": {},
            "state_changes": {}
        }
    
    def _handle_destroy_attack(self, session, state, target, params) -> Dict:
        """处理破坏攻击"""
        return {
            "success": True,
            "action_name": "DDoS攻击",
            "description": f"对{target.get('name')}发起DDoS攻击",
            "impact_scores": {"incident": -30, "loss": -10},
            "state_changes": {
                "infrastructure": {target.get("id"): "degraded"}
            }
        }
    
    def _handle_ransom_attack(self, session, state, target, params) -> Dict:
        """处理勒索攻击"""
        return {
            "success": True,
            "action_name": "勒索软件部署",
            "description": f"向{target.get('name')}部署勒索软件",
            "impact_scores": {"loss": -35, "incident": -25},
            "state_changes": {
                "infrastructure": {target.get("id"): "encrypted"}
            }
        }
    
    def _handle_phish_attack(self, session, state, target, params) -> Dict:
        """处理钓鱼攻击"""
        return {
            "success": True,
            "action_name": "钓鱼邮件",
            "description": "发送钓鱼邮件获取凭证",
            "impact_scores": {"trust": -20},
            "state_changes": {
                "credentials_stolen": True
            }
        }
    
    def _handle_chaos_attack(self, session, state, target, params) -> Dict:
        """处理混乱攻击"""
        return {
            "success": True,
            "action_name": "供应链攻击",
            "description": "通过供应链进行攻击",
            "impact_scores": {"risk": -20, "trust": -10},
            "state_changes": {
                "supply_chain_compromised": True
            }
        }
    
    # ========== 防御动作处理器 ==========
    
    def _handle_patch_defense(self, session, state, target, params) -> Dict:
        """处理打补丁防御"""
        vuln_type = params.get("vuln_type") if params else None
        
        patched_vulns = []
        if vuln_type:
            # 修复特定漏洞
            patched_vulns = [v for v in state.discovered_vulns if v.get("type") == vuln_type]
        
        return {
            "success": True,
            "action_name": "系统补丁更新",
            "description": f"成功为{target.get('name')}打补丁",
            "impact_scores": {"risk": 15, "incident": 10},
            "state_changes": {
                "vulns_patched": patched_vulns,
                "infrastructure": {target.get("id"): "patched"}
            }
        }
    
    def _handle_firewall_defense(self, session, state, target, params) -> Dict:
        """处理防火墙防御"""
        return {
            "success": True,
            "action_name": "防火墙配置",
            "description": f"为{target.get('name')}配置防火墙规则",
            "impact_scores": {"risk": 10, "trust": 5},
            "state_changes": {
                "defenses_added": [{"type": "firewall", "target": target.get("id")}]
            }
        }
    
    def _handle_monitor_defense(self, session, state, target, params) -> Dict:
        """处理监控防御"""
        # 检测已有攻击
        detected_attacks = []
        if state.compromised_systems:
            detected_attacks = state.compromised_systems[:2]  # 检测部分被攻陷系统
        
        return {
            "success": True,
            "action_name": "安全监控部署",
            "description": f"部署IDS/IPS监控{target.get('name')}",
            "impact_scores": {"trust": 15, "incident": 5},
            "state_changes": {
                "defenses_added": [{"type": "monitor", "target": target.get("id")}],
                "attacks_detected": detected_attacks
            }
        }
    
    def _handle_vaccine_defense(self, session, state, target, params) -> Dict:
        """处理疫苗防御"""
        return {
            "success": True,
            "action_name": "免疫系统部署",
            "description": "部署主动免疫防御系统",
            "impact_scores": {"risk": 20, "incident": 15},
            "state_changes": {
                "defenses_added": [{"type": "vaccine", "provides_immunity": True}]
            }
        }
    
    def _handle_ambush_defense(self, session, state, target, params) -> Dict:
        """处理埋伏防御"""
        return {
            "success": True,
            "action_name": "蜜罐部署",
            "description": "部署蜜罐系统诱捕攻击者",
            "impact_scores": {"trust": 25},
            "state_changes": {
                "defenses_added": [{"type": "honeypot", "trap_active": True}]
            }
        }
    
    def _handle_decoy_defense(self, session, state, target, params) -> Dict:
        """处理诱饵防御"""
        return {
            "success": True,
            "action_name": "欺骗式防御",
            "description": "部署欺骗系统误导攻击者",
            "impact_scores": {"trust": 20, "risk": 10},
            "state_changes": {
                "defenses_added": [{"type": "decoy", "confusion_level": "high"}]
            }
        }
    
    def _handle_guerrilla_defense(self, session, state, target, params) -> Dict:
        """处理游击防御"""
        return {
            "success": True,
            "action_name": "动态防御",
            "description": "启用移动目标防御策略",
            "impact_scores": {"risk": 15, "trust": 15},
            "state_changes": {
                "defenses_added": [{"type": "mtd", "dynamic": True}]
            }
        }
    
    def _handle_taichi_defense(self, session, state, target, params) -> Dict:
        """处理太极防御"""
        return {
            "success": True,
            "action_name": "自适应防御",
            "description": "启用AI驱动的自适应防御",
            "impact_scores": {"risk": 25, "incident": 20, "trust": 20},
            "state_changes": {
                "defenses_added": [{"type": "adaptive", "ai_powered": True}]
            }
        }
