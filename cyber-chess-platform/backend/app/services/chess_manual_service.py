"""
网安棋谱生成与管理服务
负责棋谱的生成、存储、分析和回放
"""
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from datetime import datetime
import json

from app.models.game_models import (
    GameSession, GameMove, GameState, ChessManual,
    Scenario, Track
)


class ChessManualService:
    """棋谱服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_manual(self, session_id: int) -> ChessManual:
        """
        生成棋谱
        基于文档模板生成完整的棋谱记录
        """
        session = self.db.query(GameSession).filter_by(id=session_id).first()
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        # 获取所有相关数据
        moves = self.db.query(GameMove).filter_by(
            session_id=session_id
        ).order_by(GameMove.round_number, GameMove.executed_at).all()
        
        states = self.db.query(GameState).filter_by(
            session_id=session_id
        ).order_by(GameState.round_number).all()
        
        scenario = session.scenario
        track = scenario.track
        
        # 构建棋谱数据
        manual_data = self._build_manual_data(
            session, moves, states, scenario, track
        )
        
        # 计算统计信息
        stats = self._calculate_statistics(session, moves)
        
        # 创建棋谱记录
        chess_manual = ChessManual(
            session_id=session_id,
            title=self._generate_title(session, scenario),
            description=self._generate_description(session, scenario),
            manual_data=manual_data,
            total_rounds=session.current_round,
            total_moves=len(moves),
            duration_seconds=self._calculate_duration(session),
            attack_success_rate=stats["attack_success_rate"],
            defense_effectiveness=stats["defense_effectiveness"],
            tags=self._generate_tags(session, scenario, track),
            quality_rating=self._evaluate_quality(session, moves),
            educational_value=self._evaluate_educational_value(moves)
        )
        
        self.db.add(chess_manual)
        self.db.commit()
        
        return chess_manual
    
    def _build_manual_data(
        self,
        session: GameSession,
        moves: List[GameMove],
        states: List[GameState],
        scenario: Scenario,
        track: Track
    ) -> Dict:
        """构建完整的棋谱数据结构"""
        return {
            # 元数据
            "metadata": {
                "game_id": session.id,
                "date": session.started_at.isoformat(),
                "track": {
                    "name": track.name,
                    "category": track.category,
                    "difficulty": track.difficulty_range
                },
                "scenario": {
                    "name": scenario.name,
                    "difficulty": scenario.difficulty
                },
                "players": {
                    "attacker": session.attacker_id,
                    "defender": session.defender_id
                },
                "mode": session.game_mode
            },
            
            # 背景设计（基于模板）
            "background": {
                "background_design": scenario.background_design,
                "scene_design": scenario.scene_design,
                "target_design": scenario.target_design,
                "elements": scenario.elements
            },
            
            # 初始配置
            "initial_setup": {
                "infrastructure": scenario.initial_infrastructure,
                "vulnerabilities": scenario.vulnerabilities,
                "attack_methods": scenario.penetration_methods,
                "defense_config": scenario.defense_config
            },
            
            # 对战过程
            "game_flow": self._format_game_flow(moves, states),
            
            # 关键时刻
            "key_moments": self._identify_key_moments(moves, states),
            
            # RITE评分变化
            "score_progression": self._format_score_progression(states),
            
            # 结果分析
            "result": {
                "winner": session.winner,
                "final_scores": {
                    "trust": session.trust_score,
                    "risk": session.risk_score,
                    "incident": session.incident_score,
                    "loss": session.loss_score,
                    "overall": (session.trust_score + session.risk_score + 
                               session.incident_score + session.loss_score) / 4
                },
                "end_reason": self._get_end_reason(session),
                "duration": self._calculate_duration(session)
            },
            
            # 战术分析
            "tactical_analysis": self._analyze_tactics(moves),
            
            # 知识点总结
            "knowledge_points": self._extract_knowledge_points(scenario, moves),
            
            # 参考资料（基于模板）
            "references": self._get_references(scenario)
        }
    
    def _format_game_flow(
        self,
        moves: List[GameMove],
        states: List[GameState]
    ) -> List[Dict]:
        """格式化游戏流程"""
        flow = []
        
        for move in moves:
            # 找到对应的状态
            state = next(
                (s for s in states if s.round_number == move.round_number),
                None
            )
            
            flow.append({
                "round": move.round_number,
                "player": move.player_role,
                "action": {
                    "type": move.action_type,
                    "name": move.action_name,
                    "target": move.target,
                    "parameters": move.parameters,
                    "cost": move.action_cost
                },
                "result": {
                    "success": move.success,
                    "description": move.result_description,
                    "impact": move.impact_scores
                },
                "state_after": self._format_state(state) if state else None,
                "timestamp": move.executed_at.isoformat()
            })
        
        return flow
    
    def _identify_key_moments(
        self,
        moves: List[GameMove],
        states: List[GameState]
    ) -> List[Dict]:
        """识别关键时刻"""
        key_moments = []
        
        for i, move in enumerate(moves):
            # 识别关键动作
            is_key = False
            reason = ""
            
            # 首次成功的攻击
            if move.success and move.player_role == "attacker" and i < 5:
                is_key = True
                reason = "首次成功攻击"
            
            # 重大分数变化
            if move.impact_scores:
                max_impact = max(abs(v) for v in move.impact_scores.values())
                if max_impact >= 20:
                    is_key = True
                    reason = f"重大影响 (±{max_impact}分)"
            
            # 转折点
            if i > 0 and moves[i-1].success != move.success:
                is_key = True
                reason = "攻防转折"
            
            if is_key:
                key_moments.append({
                    "round": move.round_number,
                    "action": move.action_name,
                    "player": move.player_role,
                    "reason": reason,
                    "description": move.result_description
                })
        
        return key_moments
    
    def _format_score_progression(self, states: List[GameState]) -> List[Dict]:
        """格式化分数变化"""
        progression = []
        
        for state in states:
            progression.append({
                "round": state.round_number,
                "scores": {
                    "trust": state.trust_score,
                    "risk": state.risk_score,
                    "incident": state.incident_score,
                    "loss": state.loss_score,
                    "overall": state.overall_score
                }
            })
        
        return progression
    
    def _analyze_tactics(self, moves: List[GameMove]) -> Dict:
        """分析战术"""
        attacker_tactics = {}
        defender_tactics = {}
        
        # 统计攻击方战术
        attacker_moves = [m for m in moves if m.player_role == "attacker"]
        for move in attacker_moves:
            tactic = move.action_type
            if tactic not in attacker_tactics:
                attacker_tactics[tactic] = {
                    "count": 0,
                    "success_count": 0,
                    "total_impact": 0
                }
            attacker_tactics[tactic]["count"] += 1
            if move.success:
                attacker_tactics[tactic]["success_count"] += 1
            if move.impact_scores:
                attacker_tactics[tactic]["total_impact"] += sum(
                    abs(v) for v in move.impact_scores.values()
                )
        
        # 统计防御方战术
        defender_moves = [m for m in moves if m.player_role == "defender"]
        for move in defender_moves:
            tactic = move.action_type
            if tactic not in defender_tactics:
                defender_tactics[tactic] = {
                    "count": 0,
                    "success_count": 0,
                    "total_impact": 0
                }
            defender_tactics[tactic]["count"] += 1
            if move.success:
                defender_tactics[tactic]["success_count"] += 1
            if move.impact_scores:
                defender_tactics[tactic]["total_impact"] += sum(
                    v for v in move.impact_scores.values() if v > 0
                )
        
        return {
            "attacker": {
                "tactics_used": attacker_tactics,
                "most_used": max(attacker_tactics.keys(), 
                                key=lambda k: attacker_tactics[k]["count"])
                                if attacker_tactics else None,
                "most_effective": max(attacker_tactics.keys(),
                                     key=lambda k: attacker_tactics[k]["success_count"])
                                     if attacker_tactics else None
            },
            "defender": {
                "tactics_used": defender_tactics,
                "most_used": max(defender_tactics.keys(),
                                key=lambda k: defender_tactics[k]["count"])
                                if defender_tactics else None,
                "most_effective": max(defender_tactics.keys(),
                                     key=lambda k: defender_tactics[k]["total_impact"])
                                     if defender_tactics else None
            }
        }
    
    def _extract_knowledge_points(
        self,
        scenario: Scenario,
        moves: List[GameMove]
    ) -> List[Dict]:
        """提取知识点"""
        knowledge_points = []
        
        # 从场景中提取预定义知识点
        if scenario.elements:
            for element in scenario.elements:
                knowledge_points.append({
                    "category": "scenario",
                    "topic": element,
                    "description": f"场景要素: {element}"
                })
        
        # 从实际对战中提取知识点
        action_types = set(m.action_type for m in moves)
        
        knowledge_map = {
            "exploit": "漏洞利用技术",
            "patch": "补丁管理策略",
            "firewall": "防火墙配置",
            "monitor": "入侵检测系统",
            "phish": "社会工程学",
            "ambush": "蜜罐技术",
            # ... 更多映射
        }
        
        for action in action_types:
            if action in knowledge_map:
                knowledge_points.append({
                    "category": "technique",
                    "topic": knowledge_map[action],
                    "description": f"实战应用: {knowledge_map[action]}"
                })
        
        return knowledge_points
    
    def _get_references(self, scenario: Scenario) -> List[Dict]:
        """获取参考资料"""
        references = []
        
        # 基础参考资料
        references.extend([
            {
                "title": "MITRE ATT&CK Framework",
                "url": "https://attack.mitre.org/",
                "type": "framework"
            },
            {
                "title": "网络安全'八个打'",
                "source": "大东话安全",
                "type": "article"
            },
            {
                "title": "网络安全'七宗罪'",
                "source": "大东话安全",
                "type": "article"
            }
        ])
        
        # 场景特定参考
        if scenario.penetration_methods:
            if "sql_injection" in str(scenario.penetration_methods):
                references.append({
                    "title": "OWASP SQL Injection Prevention",
                    "url": "https://owasp.org/www-community/attacks/SQL_Injection",
                    "type": "guide"
                })
        
        return references
    
    def _calculate_statistics(
        self,
        session: GameSession,
        moves: List[GameMove]
    ) -> Dict:
        """计算统计信息"""
        attacker_moves = [m for m in moves if m.player_role == "attacker"]
        defender_moves = [m for m in moves if m.player_role == "defender"]
        
        attack_success = sum(1 for m in attacker_moves if m.success)
        defense_success = sum(1 for m in defender_moves if m.success)
        
        return {
            "attack_success_rate": attack_success / len(attacker_moves) 
                                   if attacker_moves else 0,
            "defense_effectiveness": defense_success / len(defender_moves)
                                    if defender_moves else 0,
            "total_attacks": len(attacker_moves),
            "total_defenses": len(defender_moves),
            "average_action_cost": sum(m.action_cost for m in moves) / len(moves)
                                   if moves else 0
        }
    
    def _generate_title(self, session: GameSession, scenario: Scenario) -> str:
        """生成棋谱标题"""
        date_str = session.started_at.strftime("%Y%m%d")
        return f"{scenario.name} - {session.winner}方胜利 - {date_str}"
    
    def _generate_description(
        self,
        session: GameSession,
        scenario: Scenario
    ) -> str:
        """生成棋谱描述"""
        winner_desc = {
            "attacker": "攻击方成功突破防御",
            "defender": "防御方成功守护系统",
            "draw": "双方势均力敌"
        }.get(session.winner, "对战结束")
        
        return (f"{scenario.track.name}赛道的{scenario.name}场景对战。"
                f"经过{session.current_round}回合的激烈对抗，{winner_desc}。")
    
    def _calculate_duration(self, session: GameSession) -> int:
        """计算对战时长（秒）"""
        if session.ended_at:
            delta = session.ended_at - session.started_at
            return int(delta.total_seconds())
        return 0
    
    def _generate_tags(
        self,
        session: GameSession,
        scenario: Scenario,
        track: Track
    ) -> List[str]:
        """生成标签"""
        tags = [
            track.category,
            track.name,
            f"难度{scenario.difficulty}",
            session.game_mode
        ]
        
        # 添加特殊标签
        if session.current_round <= 10:
            tags.append("快速对决")
        elif session.current_round >= 20:
            tags.append("持久战")
        
        if session.winner == "attacker":
            tags.append("攻击胜利")
        elif session.winner == "defender":
            tags.append("防御胜利")
        
        return tags
    
    def _evaluate_quality(self, session: GameSession, moves: List[GameMove]) -> int:
        """评估棋谱质量（1-5星）"""
        quality_score = 3  # 基础分
        
        # 根据对战激烈程度加分
        if len(moves) >= 15:
            quality_score += 1
        
        # 根据战术多样性加分
        unique_actions = len(set(m.action_type for m in moves))
        if unique_actions >= 8:
            quality_score += 1
        
        return min(5, quality_score)
    
    def _evaluate_educational_value(self, moves: List[GameMove]) -> int:
        """评估教育价值（1-5星）"""
        edu_score = 3  # 基础分
        
        # 根据使用的技术种类评分
        action_types = set(m.action_type for m in moves)
        if len(action_types) >= 6:
            edu_score += 1
        
        # 根据攻防转换评分
        transitions = sum(
            1 for i in range(1, len(moves))
            if moves[i].player_role != moves[i-1].player_role
        )
        if transitions >= 10:
            edu_score += 1
        
        return min(5, edu_score)
    
    def _format_state(self, state: GameState) -> Dict:
        """格式化状态信息"""
        if not state:
            return None
        
        return {
            "infrastructure": state.infrastructure_state,
            "vulnerabilities": {
                "discovered": len(state.discovered_vulns),
                "list": state.discovered_vulns
            },
            "defenses": {
                "active": len(state.active_defenses),
                "list": state.active_defenses
            },
            "compromised": {
                "count": len(state.compromised_systems),
                "systems": state.compromised_systems
            }
        }
    
    def _get_end_reason(self, session: GameSession) -> str:
        """获取游戏结束原因"""
        if session.winner == "attacker":
            if session.loss_score < 30:
                return "数据被成功窃取"
            elif session.incident_score < 30:
                return "系统被完全攻陷"
            else:
                return "攻击目标达成"
        elif session.winner == "defender":
            if session.incident_score > 80:
                return "系统防御成功"
            elif session.trust_score > 80:
                return "攻击者被成功追踪"
            else:
                return "防御目标达成"
        else:
            return "达到回合上限"
    
    def get_manual(self, manual_id: int) -> Optional[ChessManual]:
        """获取棋谱"""
        return self.db.query(ChessManual).filter_by(id=manual_id).first()
    
    def search_manuals(
        self,
        track_id: Optional[int] = None,
        scenario_id: Optional[int] = None,
        winner: Optional[str] = None,
        min_quality: Optional[int] = None,
        tags: Optional[List[str]] = None,
        limit: int = 20
    ) -> List[ChessManual]:
        """搜索棋谱"""
        query = self.db.query(ChessManual).join(
            GameSession
        ).join(Scenario)
        
        if track_id:
            query = query.filter(Scenario.track_id == track_id)
        
        if scenario_id:
            query = query.filter(GameSession.scenario_id == scenario_id)
        
        if winner:
            query = query.filter(GameSession.winner == winner)
        
        if min_quality:
            query = query.filter(ChessManual.quality_rating >= min_quality)
        
        if tags:
            for tag in tags:
                query = query.filter(ChessManual.tags.contains([tag]))
        
        return query.order_by(
            ChessManual.created_at.desc()
        ).limit(limit).all()
    
    def replay_manual(self, manual_id: int) -> Dict:
        """
        回放棋谱
        返回可用于前端展示的回放数据
        """
        manual = self.get_manual(manual_id)
        if not manual:
            raise ValueError(f"Manual {manual_id} not found")
        
        return {
            "manual_id": manual.id,
            "title": manual.title,
            "description": manual.description,
            "replay_data": manual.manual_data,
            "statistics": {
                "total_rounds": manual.total_rounds,
                "total_moves": manual.total_moves,
                "duration": manual.duration_seconds,
                "attack_success_rate": manual.attack_success_rate,
                "defense_effectiveness": manual.defense_effectiveness
            },
            "ratings": {
                "quality": manual.quality_rating,
                "educational_value": manual.educational_value
            }
        }
