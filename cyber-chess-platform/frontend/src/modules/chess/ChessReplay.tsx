// 文件路径：frontend/src/modules/chess/ChessReplay.tsx
// 状态：修改现有文件（原文件为空实现）

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Button,
  Slider,
  Space,
  Tag,
  List,
  Timeline,
  Spin,
  message,
  Tooltip,
  Select,
  Typography,
  Progress,
  Statistic
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  FastBackwardOutlined,
  FastForwardOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { GameBoard } from '@/components/game/GameBoard';

const { Title, Text } = Typography;
const { Option } = Select;

// 样式组件
const ReplayContainer = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  padding: 24px;
`;

const ControlBar = styled.div`
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 0, 128, 0.1));
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
`;

const ActionLog = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  height: 400px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 212, 255, 0.5);
    border-radius: 2px;
  }
`;

const StatsCard = styled(Card)`
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.2);
  
  .ant-statistic-title {
    color: rgba(255, 255, 255, 0.65);
  }
  
  .ant-statistic-content {
    color: #00d4ff;
  }
`;

// 类型定义
interface ReplayData {
  title: string;
  players: {
    attacker: { username: string; role: string };
    defender: { username: string; role: string };
    monitor?: { username: string; role: string };
  };
  rounds: GameRound[];
  statistics: {
    totalRounds: number;
    duration: number;
    winner: string;
    attackerScore: number;
    defenderScore: number;
  };
}

interface GameRound {
  round: number;
  timestamp: string;
  actions: GameAction[];
  state: any;
}

interface GameAction {
  player: string;
  role: string;
  tactic: string;
  target?: string;
  result: string;
  damage?: number;
  resources?: any;
  description: string;
}

interface ChessReplayProps {
  chessId: string;
}

export const ChessReplay: React.FC<ChessReplayProps> = ({ chessId }) => {
  const navigate = useNavigate();
  
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [gameState, setGameState] = useState<any>(null);
  
  const intervalRef = useRef<NodeJS.Timeout>();

  // 获取回放数据
  useEffect(() => {
    if (chessId) {
      fetchReplayData();
    }
  }, [chessId]);

  // 自动播放控制
  useEffect(() => {
    if (isPlaying && replayData) {
      intervalRef.current = setInterval(() => {
        handleNextRound();
      }, 2000 / playSpeed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, currentRound, playSpeed, replayData]);

  const fetchReplayData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chess/${chessId}/replay`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setReplayData(result.data);
        if (result.data.rounds.length > 0) {
          setGameState(result.data.rounds[0].state);
        }
      } else {
        message.error('获取回放数据失败');
      }
    } catch (error) {
      console.error('获取回放数据失败:', error);
      message.error('获取回放数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 播放控制
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePreviousRound = () => {
    if (currentRound > 0) {
      const newRound = currentRound - 1;
      setCurrentRound(newRound);
      setGameState(replayData?.rounds[newRound].state);
    }
  };

  const handleNextRound = () => {
    if (replayData && currentRound < replayData.rounds.length - 1) {
      const newRound = currentRound + 1;
      setCurrentRound(newRound);
      setGameState(replayData.rounds[newRound].state);
    } else {
      setIsPlaying(false);
    }
  };

  const handleReset = () => {
    setCurrentRound(0);
    setIsPlaying(false);
    if (replayData && replayData.rounds.length > 0) {
      setGameState(replayData.rounds[0].state);
    }
  };

  const handleJumpToRound = (round: number) => {
    setCurrentRound(round);
    if (replayData) {
      setGameState(replayData.rounds[round].state);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaySpeed(speed);
  };

  const handleFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="加载回放数据..." />
        </div>
      </Card>
    );
  }

  if (!replayData) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Text>无法加载回放数据</Text>
          <br />
          <Button onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
            返回
          </Button>
        </div>
      </Card>
    );
  }

  const currentRoundData = replayData.rounds[currentRound];
  const progress = ((currentRound + 1) / replayData.rounds.length) * 100;

  return (
    <ReplayContainer>
      <Row gutter={[16, 16]}>
        {/* 游戏画面区域 */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <Title level={4} style={{ margin: 0 }}>
                  {replayData.title}
                </Title>
                <Tag color="blue">回放模式</Tag>
              </Space>
            }
            extra={
              <Space>
                <Text>
                  第 {currentRound + 1} / {replayData.rounds.length} 回合
                </Text>
                <Button
                  icon={<FullscreenOutlined />}
                  onClick={handleFullscreen}
                >
                  全屏
                </Button>
              </Space>
            }
          >
            {/* 游戏棋盘组件 - 这里使用游戏模块的棋盘组件 */}
            <div style={{ 
              minHeight: 400, 
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {gameState ? (
                <GameBoard 
                  state={gameState} 
                  readonly={true}
                  currentRound={currentRound}
                />
              ) : (
                <Text>游戏画面加载中...</Text>
              )}
            </div>

            {/* 进度条 */}
            <div style={{ marginTop: 16 }}>
              <Progress percent={progress} strokeColor="#00d4ff" />
              <Slider
                value={currentRound}
                min={0}
                max={replayData.rounds.length - 1}
                onChange={handleJumpToRound}
                tooltipVisible={false}
                style={{ marginTop: 8 }}
              />
            </div>

            {/* 控制栏 */}
            <ControlBar>
              <Row align="middle" justify="space-between">
                <Col>
                  <Space size="large">
                    <Tooltip title="重置">
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={handleReset}
                        size="large"
                      />
                    </Tooltip>
                    <Tooltip title="上一回合">
                      <Button
                        icon={<StepBackwardOutlined />}
                        onClick={handlePreviousRound}
                        disabled={currentRound === 0}
                        size="large"
                      />
                    </Tooltip>
                    <Tooltip title={isPlaying ? "暂停" : "播放"}>
                      <Button
                        type="primary"
                        icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                        onClick={handlePlayPause}
                        size="large"
                      />
                    </Tooltip>
                    <Tooltip title="下一回合">
                      <Button
                        icon={<StepForwardOutlined />}
                        onClick={handleNextRound}
                        disabled={currentRound === replayData.rounds.length - 1}
                        size="large"
                      />
                    </Tooltip>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <Text>播放速度:</Text>
                    <Select
                      value={playSpeed}
                      onChange={handleSpeedChange}
                      style={{ width: 100 }}
                    >
                      <Option value={0.5}>0.5x</Option>
                      <Option value={1}>1x</Option>
                      <Option value={1.5}>1.5x</Option>
                      <Option value={2}>2x</Option>
                      <Option value={3}>3x</Option>
                    </Select>
                  </Space>
                </Col>
              </Row>
            </ControlBar>
          </Card>
        </Col>

        {/* 信息面板 */}
        <Col xs={24} lg={8}>
          {/* 对战信息 */}
          <Card title="对战信息" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">攻击方:</Text>
                <div style={{ marginTop: 4 }}>
                  <Tag color="red" icon={<UserOutlined />}>
                    {replayData.players.attacker.username}
                  </Tag>
                </div>
              </div>
              <div>
                <Text type="secondary">防守方:</Text>
                <div style={{ marginTop: 4 }}>
                  <Tag color="blue" icon={<UserOutlined />}>
                    {replayData.players.defender.username}
                  </Tag>
                </div>
              </div>
              {replayData.players.monitor && (
                <div>
                  <Text type="secondary">监管方:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Tag color="green" icon={<UserOutlined />}>
                      {replayData.players.monitor.username}
                    </Tag>
                  </div>
                </div>
              )}
            </Space>
          </Card>

          {/* 统计信息 */}
          <StatsCard title="对战统计" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="总回合数"
                  value={replayData.statistics.totalRounds}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="用时"
                  value={`${Math.floor(replayData.statistics.duration / 60)}分`}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="攻击方得分"
                  value={replayData.statistics.attackerScore}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="防守方得分"
                  value={replayData.statistics.defenderScore}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Tag color={replayData.statistics.winner === 'attacker' ? 'red' : 'blue'}>
                <ThunderboltOutlined /> {replayData.statistics.winner === 'attacker' ? '攻击方' : '防守方'}胜利
              </Tag>
            </div>
          </StatsCard>

          {/* 行动日志 */}
          <Card title="行动日志">
            <ActionLog>
              <Timeline mode="left">
                {currentRoundData?.actions.map((action, index) => (
                  <Timeline.Item
                    key={index}
                    color={action.role === 'attacker' ? 'red' : 'blue'}
                    label={`回合 ${currentRound + 1}`}
                  >
                    <Space direction="vertical" size="small">
                      <Text strong>
                        {action.player} ({action.role === 'attacker' ? '攻击方' : '防守方'})
                      </Text>
                      <Text>使用战术: {action.tactic}</Text>
                      {action.target && (
                        <Text type="secondary">目标: {action.target}</Text>
                      )}
                      <Text type={action.result === 'success' ? 'success' : 'danger'}>
                        结果: {action.description}
                      </Text>
                      {action.damage && (
                        <Tag color="red">伤害: {action.damage}</Tag>
                      )}
                    </Space>
                  </Timeline.Item>
                ))}
              </Timeline>
            </ActionLog>
          </Card>
        </Col>
      </Row>
    </ReplayContainer>
  );
};

export default ChessReplay;