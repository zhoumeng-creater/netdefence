/**
 * 网安棋谱游戏主组件
 * 实现完整的游戏对战功能
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Modal, message, Tabs, Badge, Progress, Tooltip, Space, Tag } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  SaveOutlined,
  HistoryOutlined,
  TrophyOutlined,
  AlertOutlined,
  SafetyOutlined,
  BugOutlined,
  AimOutlined
} from '@ant-design/icons';
import './GamePlay.css';

// 子组件导入
import BattlefieldView from './game/BattlefieldView';
import AttackToolbox from './game/AttackToolbox';
import DefenseToolbox from './game/DefenseToolbox';
import GameHistory from './game/GameHistory';
import RITEScorePanel from './game/RITEScorePanel';
import ScenarioInfo from './game/ScenarioInfo';

// 类型定义
interface GameSession {
  id: number;
  scenario: {
    id: number;
    name: string;
    background_design: string;
    scene_design: string;
  };
  current_round: number;
  current_turn: 'attacker' | 'defender';
  current_phase: string;
  status: string;
  winner?: string;
  scores: {
    trust: number;
    risk: number;
    incident: number;
    loss: number;
  };
  resources: {
    attacker: {
      action_points: number;
      tools: string[];
    };
    defender: {
      action_points: number;
      tools: string[];
    };
  };
  state: {
    infrastructure: any;
    discovered_vulns: any[];
    active_defenses: any[];
    compromised_systems: any[];
  };
}

interface GameMove {
  round: number;
  player: string;
  action: string;
  action_name: string;
  target: any;
  success: boolean;
  description: string;
  impact: any;
  timestamp: string;
}

const GamePlay: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const ws = useRef<WebSocket | null>(null);

  // 游戏状态
  const [loading, setLoading] = useState(true);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [playerRole, setPlayerRole] = useState<'attacker' | 'defender' | 'observer'>('observer');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [gameHistory, setGameHistory] = useState<GameMove[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // 模态框状态
  const [showScenarioModal, setShowScenarioModal] = useState(true);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [victoryInfo, setVictoryInfo] = useState<any>(null);

  // 初始化游戏
  useEffect(() => {
    if (sessionId) {
      loadGameSession();
      initWebSocket();
    }

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [sessionId]);

  // 加载游戏会话
  const loadGameSession = async () => {
    try {
      const response = await fetch(`/api/game/session/${sessionId}`);
      const data = await response.json();
      setGameSession(data);
      
      // 加载历史记录
      const historyResponse = await fetch(`/api/game/history/${sessionId}`);
      const historyData = await historyResponse.json();
      setGameHistory(historyData.moves);
      
      setLoading(false);
    } catch (error) {
      message.error('加载游戏失败');
      console.error(error);
      setLoading(false);
    }
  };

  // 初始化WebSocket连接
  const initWebSocket = () => {
    const wsUrl = `ws://localhost:8000/api/game/ws/${sessionId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      message.error('连接错误');
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
    };
  };

  // 处理WebSocket消息
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'move_result':
        handleMoveResult(data.result);
        break;
      case 'game_over':
        handleGameOver(data);
        break;
      case 'state_update':
        updateGameState(data.state);
        break;
      case 'chat':
        // 处理聊天消息
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  // 执行游戏动作
  const executeMove = async () => {
    if (!selectedTool || !selectedTarget) {
      message.warning('请选择工具和目标');
      return;
    }

    if (gameSession?.current_turn !== playerRole) {
      message.warning('还没轮到你的回合');
      return;
    }

    setIsExecuting(true);

    try {
      const response = await fetch('/api/game/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          player_role: playerRole,
          action_type: selectedTool,
          target: selectedTarget,
          parameters: {}
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        handleMoveResult(result);
      } else {
        message.error(result.detail || '执行失败');
      }
    } catch (error) {
      message.error('执行动作失败');
      console.error(error);
    } finally {
      setIsExecuting(false);
      setSelectedTool(null);
      setSelectedTarget(null);
    }
  };

  // 处理动作结果
  const handleMoveResult = (result: any) => {
    // 更新游戏状态
    if (result.state_changes) {
      updateGameState(result.state_changes);
    }

    // 更新分数
    if (result.current_scores && gameSession) {
      setGameSession({
        ...gameSession,
        scores: result.current_scores
      });
    }

    // 显示结果消息
    if (result.success) {
      message.success(result.description);
    } else {
      message.warning(result.description);
    }

    // 添加到历史记录
    const newMove: GameMove = {
      round: gameSession?.current_round || 0,
      player: result.player || playerRole,
      action: result.action,
      action_name: result.action_name,
      target: result.target,
      success: result.success,
      description: result.description,
      impact: result.impact_scores,
      timestamp: new Date().toISOString()
    };
    setGameHistory([...gameHistory, newMove]);

    // 切换回合
    if (gameSession && result.next_turn) {
      setGameSession({
        ...gameSession,
        current_turn: result.next_turn
      });
    }

    // 检查游戏结束
    if (result.game_status?.game_over) {
      handleGameOver(result.game_status);
    }
  };

  // 更新游戏状态
  const updateGameState = (changes: any) => {
    if (!gameSession) return;

    const newState = { ...gameSession.state };

    if (changes.infrastructure) {
      Object.assign(newState.infrastructure, changes.infrastructure);
    }
    if (changes.vulns_discovered) {
      newState.discovered_vulns.push(...changes.vulns_discovered);
    }
    if (changes.defenses_added) {
      newState.active_defenses.push(...changes.defenses_added);
    }
    if (changes.systems_compromised) {
      newState.compromised_systems.push(...changes.systems_compromised);
    }

    setGameSession({
      ...gameSession,
      state: newState
    });
  };

  // 处理游戏结束
  const handleGameOver = (gameOverInfo: any) => {
    setVictoryInfo(gameOverInfo);
    setShowVictoryModal(true);

    // 生成棋谱
    generateChessManual();
  };

  // 生成棋谱
  const generateChessManual = async () => {
    try {
      const response = await fetch(`/api/game/manual/generate/${sessionId}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const manual = await response.json();
        message.success('棋谱已生成');
      }
    } catch (error) {
      console.error('生成棋谱失败:', error);
    }
  };

  // 保存游戏
  const saveGame = () => {
    message.info('游戏已自动保存');
  };

  // 退出游戏
  const exitGame = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出游戏吗？游戏进度将被保存。',
      onOk: () => {
        navigate('/game');
      }
    });
  };

  if (loading) {
    return <div className="loading-container">加载中...</div>;
  }

  if (!gameSession) {
    return <div className="error-container">游戏会话不存在</div>;
  }

  return (
    <div className="gameplay-container">
      {/* 顶部信息栏 */}
      <div className="game-header">
        <div className="game-info">
          <h2>{gameSession.scenario.name}</h2>
          <Space>
            <Tag color="blue">第 {gameSession.current_round} 回合</Tag>
            <Tag color={gameSession.current_turn === 'attacker' ? 'red' : 'green'}>
              {gameSession.current_turn === 'attacker' ? '攻击方' : '防御方'}回合
            </Tag>
            {playerRole !== 'observer' && (
              <Tag color="gold">
                你是{playerRole === 'attacker' ? '攻击方' : '防御方'}
              </Tag>
            )}
          </Space>
        </div>
        
        <div className="game-controls">
          <Space>
            <Button icon={<SaveOutlined />} onClick={saveGame}>保存</Button>
            <Button icon={<HistoryOutlined />} onClick={() => navigate(`/game/manual/${sessionId}`)}>
              查看棋谱
            </Button>
            <Button danger icon={<StopOutlined />} onClick={exitGame}>退出</Button>
          </Space>
        </div>
      </div>

      {/* 主游戏区域 */}
      <div className="game-main">
        <div className="game-left">
          {/* RITE评分面板 */}
          <RITEScorePanel scores={gameSession.scores} />
          
          {/* 资源显示 */}
          <Card title="资源状态" size="small" className="resource-panel">
            <div className="resource-item">
              <span>攻击方行动点：</span>
              <Progress 
                percent={gameSession.resources.attacker.action_points * 10} 
                steps={10} 
                size="small"
                strokeColor="#ff4d4f"
              />
            </div>
            <div className="resource-item">
              <span>防御方行动点：</span>
              <Progress 
                percent={gameSession.resources.defender.action_points * 10} 
                steps={10} 
                size="small"
                strokeColor="#52c41a"
              />
            </div>
          </Card>
        </div>

        <div className="game-center">
          {/* 战场视图 */}
          <BattlefieldView
            infrastructure={gameSession.state.infrastructure}
            vulnerabilities={gameSession.state.discovered_vulns}
            defenses={gameSession.state.active_defenses}
            compromised={gameSession.state.compromised_systems}
            onSelectTarget={setSelectedTarget}
            selectedTarget={selectedTarget}
          />
          
          {/* 工具箱 */}
          <div className="toolbox-container">
            <Tabs defaultActiveKey={playerRole}>
              <Tabs.TabPane 
                tab={<span><BugOutlined />攻击工具</span>} 
                key="attacker"
                disabled={playerRole === 'defender'}
              >
                <AttackToolbox
                  available={gameSession.resources.attacker.tools}
                  selected={selectedTool}
                  onSelect={setSelectedTool}
                  disabled={gameSession.current_turn !== 'attacker' || playerRole !== 'attacker'}
                />
              </Tabs.TabPane>
              
              <Tabs.TabPane 
                tab={<span><SafetyOutlined />防御工具</span>} 
                key="defender"
                disabled={playerRole === 'attacker'}
              >
                <DefenseToolbox
                  available={gameSession.resources.defender.tools}
                  selected={selectedTool}
                  onSelect={setSelectedTool}
                  disabled={gameSession.current_turn !== 'defender' || playerRole !== 'defender'}
                />
              </Tabs.TabPane>
            </Tabs>
            
            {/* 执行按钮 */}
            {playerRole !== 'observer' && (
              <div className="action-controls">
                <Button
                  type="primary"
                  size="large"
                  icon={<AimOutlined />}
                  onClick={executeMove}
                  disabled={
                    !selectedTool || 
                    !selectedTarget || 
                    gameSession.current_turn !== playerRole ||
                    isExecuting
                  }
                  loading={isExecuting}
                  block
                >
                  执行动作
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="game-right">
          {/* 游戏历史 */}
          <GameHistory moves={gameHistory} />
        </div>
      </div>

      {/* 场景介绍模态框 */}
      <Modal
        title="场景介绍"
        visible={showScenarioModal}
        onOk={() => setShowScenarioModal(false)}
        onCancel={() => setShowScenarioModal(false)}
        width={800}
        footer={[
          <Button key="role-attacker" type="primary" danger onClick={() => {
            setPlayerRole('attacker');
            setShowScenarioModal(false);
          }}>
            我是攻击方
          </Button>,
          <Button key="role-defender" type="primary" onClick={() => {
            setPlayerRole('defender');
            setShowScenarioModal(false);
          }}>
            我是防御方
          </Button>,
          <Button key="role-observer" onClick={() => {
            setPlayerRole('observer');
            setShowScenarioModal(false);
          }}>
            观战模式
          </Button>
        ]}
      >
        <ScenarioInfo scenario={gameSession.scenario} />
      </Modal>

      {/* 胜利模态框 */}
      <Modal
        title={<span><TrophyOutlined /> 游戏结束</span>}
        visible={showVictoryModal}
        onOk={() => navigate('/game')}
        onCancel={() => setShowVictoryModal(false)}
        width={600}
        footer={[
          <Button key="view-manual" type="primary" onClick={() => navigate(`/game/manual/${sessionId}`)}>
            查看棋谱
          </Button>,
          <Button key="back" onClick={() => navigate('/game')}>
            返回大厅
          </Button>
        ]}
      >
        {victoryInfo && (
          <div className="victory-info">
            <h2>{victoryInfo.winner === 'attacker' ? '攻击方' : '防御方'}获胜！</h2>
            <p>胜利原因：{victoryInfo.reason}</p>
            <div className="final-scores">
              <h3>最终得分</h3>
              <RITEScorePanel scores={gameSession.scores} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GamePlay;