/**
 * 网安棋谱游戏主组件
 * 实现完整的游戏对战功能
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Modal, 
  message, 
  Tabs, 
  Badge, 
  Progress, 
  Tooltip, 
  Space, 
  Tag,
  Row,
  Col,
  Spin,
  Result,
  Typography,
  Drawer,
  Timeline,
  Statistic,
  Alert
} from 'antd';
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
  AimOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  FireOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { gameApi, GameSession, GameMove, GameTool } from '@/services/gameApi';
import { useAuth } from '@/hooks/useAuth';

// 导入子组件
import BattlefieldView from './components/BattlefieldView';
import AttackToolbox from './components/AttackToolbox';
import DefenseToolbox from './components/DefenseToolbox';
import GameHistoryPanel from './components/GameHistoryPanel';
import RITEScorePanel from './components/RITEScorePanel';
import ScenarioInfo from './components/ScenarioInfo';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// 样式组件
const GameContainer = styled.div`
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0f1419 0%, #1a2332 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
    background-size: 50px 50px;
    pointer-events: none;
    z-index: 0;
  }
`;

const GameHeader = styled.div`
  background: rgba(26, 35, 50, 0.95);
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
  backdrop-filter: blur(10px);
  z-index: 10;
`;

const GameMain = styled.div`
  flex: 1;
  display: flex;
  padding: 16px;
  gap: 16px;
  overflow: hidden;
  z-index: 1;
`;

const GameLeft = styled.div`
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const GameCenter = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
`;

const GameRight = styled.div`
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StyledCard = styled(Card)`
  background: rgba(26, 35, 50, 0.95);
  border: 1px solid rgba(0, 212, 255, 0.2);
  backdrop-filter: blur(10px);
  
  .ant-card-head {
    border-bottom: 1px solid rgba(0, 212, 255, 0.1);
    background: rgba(0, 212, 255, 0.05);
    
    .ant-card-head-title {
      color: #00d4ff;
    }
  }
  
  .ant-card-body {
    max-height: 100%;
    overflow-y: auto;
    
    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 212, 255, 0.3);
      border-radius: 2px;
    }
  }
`;

const ActionButton = styled(Button)`
  background: linear-gradient(135deg, #00d4ff, #0099cc);
  border: none;
  height: 40px;
  font-size: 16px;
  font-weight: 600;
  
  &:hover {
    background: linear-gradient(135deg, #0099cc, #00d4ff);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
  }
  
  &:disabled {
    background: #666;
    opacity: 0.5;
  }
`;

const GamePlay: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const ws = useRef<WebSocket | null>(null);

  // 游戏状态
  const [loading, setLoading] = useState(true);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [playerRole, setPlayerRole] = useState<'attacker' | 'defender' | 'observer'>('observer');
  const [selectedTool, setSelectedTool] = useState<GameTool | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [gameHistory, setGameHistory] = useState<GameMove[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);

  // UI状态
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [victoryInfo, setVictoryInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('tools');

  // 定时器
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionId]);

  // 加载游戏会话
  const loadGameSession = async () => {
    setLoading(true);
    try {
      const session = await gameApi.getGameSession(sessionId!);
      setGameSession(session);
      
      // 确定玩家角色
      if (session.mode === 'PVE') {
        setPlayerRole('attacker'); // PVE模式默认为攻击方
      } else if (session.mode === 'PVP') {
        // TODO: 根据用户ID确定角色
        setPlayerRole('attacker');
      }
      
      // 加载历史记录
      const history = await gameApi.getGameHistory(sessionId!);
      setGameHistory(history.moves);
      
      // 显示场景介绍
      setShowScenarioModal(true);
      
      setLoading(false);
    } catch (error) {
      message.error('加载游戏失败');
      console.error(error);
      setLoading(false);
    }
  };

  // 初始化WebSocket连接
  const initWebSocket = () => {
    const wsUrl = gameApi.getWebSocketUrl(sessionId!);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      message.success('已连接到游戏服务器');
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
      message.warning('与服务器断开连接');
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
      case 'opponent_move':
        handleOpponentMove(data.move);
        break;
      case 'timer_update':
        setTimeRemaining(data.time);
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
      const response = await gameApi.executeAction(sessionId!, {
        type: playerRole === 'attacker' ? 'attack' : 'defense',
        tool: selectedTool.id,
        target: selectedTarget,
      });

      if (response.success) {
        // 更新游戏状态
        setGameSession(response.gameState);
        
        // 添加到历史记录
        setGameHistory(prev => [...prev, response.result]);
        
        // 清空选择
        setSelectedTool(null);
        setSelectedTarget(null);
        
        message.success('行动执行成功');
      } else {
        message.error('行动执行失败');
      }
    } catch (error) {
      message.error('执行失败');
      console.error(error);
    } finally {
      setIsExecuting(false);
    }
  };

  // 处理移动结果
  const handleMoveResult = (result: GameMove) => {
    setGameHistory(prev => [...prev, result]);
    
    // 显示动作结果
    if (result.success) {
      message.success(result.description);
    } else {
      message.warning(result.description);
    }
  };

  // 处理对手移动
  const handleOpponentMove = (move: GameMove) => {
    setGameHistory(prev => [...prev, move]);
    message.info(`对手执行了: ${move.action_name}`);
  };

  // 更新游戏状态
  const updateGameState = (newState: Partial<GameSession>) => {
    setGameSession(prev => prev ? { ...prev, ...newState } : null);
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
      const manual = await gameApi.generateChessManual(sessionId!);
      message.success('棋谱已生成');
    } catch (error) {
      console.error('生成棋谱失败:', error);
    }
  };

  // 保存游戏
  const saveGame = async () => {
    try {
      await gameApi.saveGame(sessionId!);
      message.success('游戏已保存');
    } catch (error) {
      message.error('保存失败');
    }
  };

  // 投降
  const surrender = () => {
    Modal.confirm({
      title: '确认投降',
      content: '确定要投降吗？这将结束游戏。',
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await gameApi.surrender(sessionId!);
          message.info('您已投降');
        } catch (error) {
          message.error('操作失败');
        }
      }
    });
  };

  // 退出游戏
  const exitGame = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出游戏吗？游戏进度将被保存。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        saveGame();
        navigate('/game');
      }
    });
  };

  // 渲染工具箱
  const renderToolbox = () => {
    if (playerRole === 'attacker') {
      return (
        <AttackToolbox
          available={gameSession?.resources.attacker.tools || []}
          selected={selectedTool?.id || null}
          onSelect={(toolId) => {
            // 根据toolId获取工具详情
            const tool = { id: toolId, name: toolId } as GameTool;
            setSelectedTool(tool);
          }}
          disabled={gameSession?.current_turn !== 'attacker' || isExecuting}
          actionPoints={gameSession?.resources.attacker.action_points || 0}
        />
      );
    } else if (playerRole === 'defender') {
      return (
        <DefenseToolbox
          available={gameSession?.resources.defender.tools || []}
          selected={selectedTool?.id || null}
          onSelect={(toolId) => {
            const tool = { id: toolId, name: toolId } as GameTool;
            setSelectedTool(tool);
          }}
          disabled={gameSession?.current_turn !== 'defender' || isExecuting}
          actionPoints={gameSession?.resources.defender.action_points || 0}
        />
      );
    }
    return null;
  };

  if (loading) {
    return (
      <GameContainer>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%' 
        }}>
          <Spin size="large" tip="加载游戏中..." />
        </div>
      </GameContainer>
    );
  }

  if (!gameSession) {
    return (
      <GameContainer>
        <Result
          status="error"
          title="游戏加载失败"
          subTitle="无法加载游戏会话，请重试"
          extra={[
            <Button key="back" onClick={() => navigate('/game')}>
              返回游戏大厅
            </Button>
          ]}
        />
      </GameContainer>
    );
  }

  return (
    <GameContainer>
      {/* 顶部信息栏 */}
      <GameHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Title level={4} style={{ margin: 0, color: '#00d4ff' }}>
            {gameSession.scenario.name}
          </Title>
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
            {timeRemaining > 0 && (
              <Tag icon={<ClockCircleOutlined />} color="orange">
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </Tag>
            )}
          </Space>
        </div>
        
        <Space>
          <Button icon={<SaveOutlined />} onClick={saveGame}>
            保存
          </Button>
          <Button 
            icon={<HistoryOutlined />} 
            onClick={() => setShowHistoryDrawer(true)}
          >
            历史
          </Button>
          <Button 
            danger 
            icon={<StopOutlined />} 
            onClick={surrender}
          >
            投降
          </Button>
          <Button 
            icon={<StopOutlined />} 
            onClick={exitGame}
          >
            退出
          </Button>
        </Space>
      </GameHeader>

      {/* 主游戏区域 */}
      <GameMain>
        {/* 左侧面板 */}
        <GameLeft>
          {/* RITE评分 */}
          <StyledCard 
            title="RITE评分" 
            size="small"
            extra={<Tooltip title="详细分析"><Button type="link" size="small">查看</Button></Tooltip>}
          >
            <RITEScorePanel scores={gameSession.scores} />
          </StyledCard>
          
          {/* 资源状态 */}
          <StyledCard title="资源状态" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                  <FireOutlined style={{ color: '#ff4d4f' }} /> 攻击方行动点
                </Text>
                <Progress 
                  percent={gameSession.resources.attacker.action_points * 10} 
                  steps={10} 
                  size="small"
                  strokeColor="#ff4d4f"
                />
              </div>
              <div>
                <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                  <SafetyOutlined style={{ color: '#52c41a' }} /> 防御方行动点
                </Text>
                <Progress 
                  percent={gameSession.resources.defender.action_points * 10} 
                  steps={10} 
                  size="small"
                  strokeColor="#52c41a"
                />
              </div>
            </Space>
          </StyledCard>

          {/* 场景信息 */}
          <StyledCard title="场景信息" size="small">
            <ScenarioInfo scenario={gameSession.scenario} />
          </StyledCard>
        </GameLeft>

        {/* 中央战场 */}
        <GameCenter>
          <StyledCard 
            title="战场态势" 
            style={{ flex: 1 }}
            extra={
              <Space>
                <Tag color="blue">实时</Tag>
                <Button 
                  type="link" 
                  size="small" 
                  icon={<ThunderboltOutlined />}
                >
                  自动分析
                </Button>
              </Space>
            }
          >
            <BattlefieldView
              infrastructure={gameSession.state.infrastructure}
              vulnerabilities={gameSession.state.discovered_vulns}
              defenses={gameSession.state.active_defenses}
              compromised={gameSession.state.compromised_systems}
              onSelectTarget={setSelectedTarget}
              selectedTarget={selectedTarget}
            />
          </StyledCard>
          
          {/* 行动控制 */}
          <StyledCard size="small">
            <Row gutter={16} align="middle">
              <Col span={8}>
                <Statistic 
                  title="选中工具" 
                  value={selectedTool?.name || '未选择'} 
                  valueStyle={{ fontSize: 14, color: selectedTool ? '#00d4ff' : '#666' }}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="选中目标" 
                  value={selectedTarget?.name || '未选择'} 
                  valueStyle={{ fontSize: 14, color: selectedTarget ? '#00d4ff' : '#666' }}
                />
              </Col>
              <Col span={8} style={{ textAlign: 'right' }}>
                <ActionButton
                  type="primary"
                  size="large"
                  icon={<RocketOutlined />}
                  onClick={executeMove}
                  disabled={
                    !selectedTool || 
                    !selectedTarget || 
                    gameSession.current_turn !== playerRole ||
                    isExecuting
                  }
                  loading={isExecuting}
                >
                  执行行动
                </ActionButton>
              </Col>
            </Row>
          </StyledCard>
        </GameCenter>

        {/* 右侧面板 */}
        <GameRight>
          <StyledCard style={{ flex: 1 }}>
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              type="card"
            >
              <TabPane 
                tab={
                  <span>
                    {playerRole === 'attacker' ? <BugOutlined /> : <SafetyOutlined />}
                    {' '}工具箱
                  </span>
                } 
                key="tools"
              >
                {renderToolbox()}
              </TabPane>
              <TabPane 
                tab={
                  <span>
                    <HistoryOutlined /> 最近行动
                  </span>
                } 
                key="history"
              >
                <Timeline mode="left">
                  {gameHistory.slice(-5).reverse().map((move, index) => (
                    <Timeline.Item 
                      key={index}
                      color={move.player === 'attacker' ? 'red' : 'green'}
                      label={`回合 ${move.round}`}
                    >
                      <Text strong>{move.action_name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {move.description}
                      </Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </TabPane>
            </Tabs>
          </StyledCard>
        </GameRight>
      </GameMain>

      {/* 场景介绍模态框 */}
      <Modal
        title={gameSession.scenario.name}
        visible={showScenarioModal}
        onOk={() => setShowScenarioModal(false)}
        onCancel={() => setShowScenarioModal(false)}
        width={700}
        footer={[
          <Button key="start" type="primary" onClick={() => setShowScenarioModal(false)}>
            开始游戏
          </Button>
        ]}
      >
        <ScenarioInfo scenario={gameSession.scenario} detailed />
      </Modal>

      {/* 胜利模态框 */}
      <Modal
        title={
          <span>
            <TrophyOutlined style={{ color: '#faad14', marginRight: 8 }} />
            游戏结束
          </span>
        }
        visible={showVictoryModal}
        onOk={() => {
          setShowVictoryModal(false);
          navigate('/game');
        }}
        onCancel={() => setShowVictoryModal(false)}
        width={600}
      >
        {victoryInfo && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Title level={2} style={{ color: victoryInfo.winner === playerRole ? '#52c41a' : '#ff4d4f' }}>
              {victoryInfo.winner === playerRole ? '胜利！' : '失败'}
            </Title>
            <Paragraph>
              获胜方：{victoryInfo.winner === 'attacker' ? '攻击方' : '防御方'}
            </Paragraph>
            <Row gutter={16} style={{ marginTop: 24 }}>
              <Col span={12}>
                <Statistic 
                  title="总回合数" 
                  value={gameSession.current_round} 
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="总用时" 
                  value={victoryInfo.duration || '00:00'} 
                />
              </Col>
            </Row>
            <div style={{ marginTop: 24 }}>
              <Title level={4}>最终RITE评分</Title>
              <RITEScorePanel scores={gameSession.scores} />
            </div>
          </div>
        )}
      </Modal>

      {/* 历史记录抽屉 */}
      <Drawer
        title="游戏历史"
        placement="right"
        width={480}
        visible={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
      >
        <GameHistoryPanel moves={gameHistory} />
      </Drawer>
    </GameContainer>
  );
};

export default GamePlay;