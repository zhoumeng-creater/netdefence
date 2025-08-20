/**
 * 游戏大厅组件
 * 显示赛道、场景列表，允许用户选择并开始游戏
 */
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  List, 
  Tag, 
  Space, 
  Modal, 
  Select, 
  Row, 
  Col,
  Badge,
  Tabs,
  message,
  Empty,
  Spin,
  Typography,
  Radio,
  Statistic,
  Progress,
  Tooltip
} from 'antd';
import { 
  PlayCircleOutlined, 
  RocketOutlined,
  TrophyOutlined,
  FireOutlined,
  BugOutlined,
  SafetyOutlined,
  TeamOutlined,
  RobotOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  StarOutlined,
  ThunderboltOutlined,
  ExperimentOutlined,
  GlobalOutlined,
  ApiOutlined,
  CloudOutlined,
  DatabaseOutlined,
  LockOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { gameApi, Track, Scenario } from '@/services/gameApi';
import { useAuth } from '@/hooks/useAuth';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// 样式组件
const StyledCard = styled(Card)`
  background: rgba(26, 35, 50, 0.95);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 12px;
  
  .ant-card-head {
    border-bottom: 1px solid rgba(0, 212, 255, 0.1);
    
    .ant-card-head-title {
      color: #00d4ff;
      font-size: 18px;
      font-weight: 600;
    }
  }
  
  .ant-card-body {
    background: transparent;
  }
`;

const TrackCard = styled(Card)`
  background: linear-gradient(135deg, rgba(26, 35, 50, 0.9), rgba(0, 212, 255, 0.05));
  border: 2px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
  height: 100%;
  
  &:hover {
    transform: translateY(-4px);
    border-color: #00d4ff;
    box-shadow: 0 8px 24px rgba(0, 212, 255, 0.3);
  }
  
  .ant-card-body {
    padding: 20px;
  }
  
  .track-icon {
    font-size: 48px;
    margin-bottom: 16px;
    background: linear-gradient(135deg, #00d4ff, #ff0080);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .track-name {
    font-size: 18px;
    font-weight: bold;
    color: #fff;
    margin-bottom: 8px;
  }
  
  .track-desc {
    color: rgba(255, 255, 255, 0.65);
    font-size: 14px;
    line-height: 1.6;
  }
`;

const ScenarioCard = styled(Card)`
  background: rgba(26, 35, 50, 0.8);
  border: 1px solid rgba(0, 212, 255, 0.2);
  margin-bottom: 16px;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #00d4ff;
    background: rgba(26, 35, 50, 0.95);
    transform: translateX(4px);
  }
  
  .ant-card-body {
    padding: 16px;
  }
  
  .scenario-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .scenario-name {
    font-size: 16px;
    font-weight: 600;
    color: #00d4ff;
  }
  
  .scenario-desc {
    color: rgba(255, 255, 255, 0.65);
    font-size: 14px;
    margin-bottom: 12px;
  }
`;

const QuickStartCard = styled(Card)`
  background: linear-gradient(135deg, rgba(255, 0, 128, 0.1), rgba(0, 212, 255, 0.1));
  border: 2px solid #00d4ff;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 32px rgba(0, 212, 255, 0.4);
  }
  
  .quick-start-icon {
    font-size: 64px;
    color: #00d4ff;
    margin-bottom: 16px;
  }
`;

const StatsCard = styled(Card)`
  background: rgba(26, 35, 50, 0.9);
  border: 1px solid rgba(0, 212, 255, 0.2);
  
  .ant-statistic-title {
    color: rgba(255, 255, 255, 0.65);
  }
  
  .ant-statistic-content {
    color: #00d4ff;
  }
`;

// 赛道图标映射
const trackIcons: { [key: string]: React.ReactNode } = {
  '网络入侵': <GlobalOutlined />,
  '系统漏洞': <BugOutlined />,
  '数据安全': <DatabaseOutlined />,
  'API安全': <ApiOutlined />,
  '云安全': <CloudOutlined />,
  '密码学': <LockOutlined />,
};

// 难度颜色映射
const difficultyColors: { [key: string]: string } = {
  'easy': 'green',
  'medium': 'orange',
  'hard': 'red',
  'expert': 'purple',
};

const difficultyLabels: { [key: string]: string } = {
  'easy': '简单',
  'medium': '中等',
  'hard': '困难',
  'expert': '专家',
};

const GameLobby: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [gameMode, setGameMode] = useState<'PVE' | 'PVP'>('PVE');
  const [showStartModal, setShowStartModal] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);

  // 判断是否是快速开始模式
  const isQuickStart = location.pathname === '/game/quick-start';

  // 加载赛道列表
  useEffect(() => {
    loadTracks();
    loadUserStats();
    
    // 如果是快速开始，自动选择推荐场景
    if (isQuickStart) {
      handleQuickStart();
    }
  }, [isQuickStart]);

  // 加载赛道数据
  const loadTracks = async () => {
    setLoading(true);
    try {
      // 模拟赛道数据（实际应从API获取）
      const mockTracks: Track[] = [
        {
          id: 1,
          name: '网络入侵',
          category: 'network',
          description: '模拟真实的网络攻防场景，包括端口扫描、漏洞利用等',
          scenarios: []
        },
        {
          id: 2,
          name: '系统漏洞',
          category: 'system',
          description: '针对操作系统和应用程序漏洞的攻防演练',
          scenarios: []
        },
        {
          id: 3,
          name: '数据安全',
          category: 'data',
          description: '数据泄露防护、加密解密、数据库安全等场景',
          scenarios: []
        },
        {
          id: 4,
          name: 'API安全',
          category: 'api',
          description: 'RESTful API、GraphQL等接口安全攻防',
          scenarios: []
        },
        {
          id: 5,
          name: '云安全',
          category: 'cloud',
          description: '云平台配置错误、容器逃逸等云安全场景',
          scenarios: []
        },
        {
          id: 6,
          name: '密码学',
          category: 'crypto',
          description: '密码破解、加密算法弱点利用等',
          scenarios: []
        }
      ];
      
      setTracks(mockTracks);
      
      // 如果有tracks，默认选择第一个
      if (mockTracks.length > 0) {
        handleTrackSelect(mockTracks[0]);
      }
    } catch (error) {
      message.error('加载赛道失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 加载用户统计
  const loadUserStats = async () => {
    try {
      // const stats = await gameApi.getUserStats();
      // setUserStats(stats);
      
      // 模拟数据
      setUserStats({
        total_games: 42,
        wins: 28,
        losses: 14,
        win_rate: 66.7,
        favorite_role: 'defender',
        rank: 156
      });
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  // 选择赛道
  const handleTrackSelect = async (track: Track) => {
    setSelectedTrack(track);
    setLoading(true);
    
    try {
      // 模拟场景数据（实际应从API获取）
      const mockScenarios: Scenario[] = [
        {
          id: 1,
          trackId: track.id,
          name: '初级网络渗透',
          description: '学习基础的网络扫描和信息收集技术',
          difficulty: 'easy',
          background_design: '企业内网环境，包含Web服务器、数据库和员工终端',
          scene_design: '模拟小型企业网络，存在常见配置错误',
          objectives: {
            attacker: ['获取目标服务器权限', '窃取敏感数据'],
            defender: ['保护核心资产', '及时响应入侵']
          },
          initial_resources: {
            attacker: { action_points: 10, tools: ['nmap', 'metasploit'] },
            defender: { action_points: 10, tools: ['firewall', 'ids'] }
          },
          max_rounds: 20,
          time_limit: 1800
        },
        {
          id: 2,
          trackId: track.id,
          name: '中级漏洞利用',
          description: '深入学习漏洞发现和利用技术',
          difficulty: 'medium',
          background_design: '中型企业环境，多层网络架构',
          scene_design: 'DMZ区域、内网隔离、基础安全设备',
          objectives: {
            attacker: ['突破DMZ', '横向移动', '权限提升'],
            defender: ['阻止入侵', '最小化损失', '溯源取证']
          },
          initial_resources: {
            attacker: { action_points: 15, tools: ['burpsuite', 'sqlmap', 'hydra'] },
            defender: { action_points: 15, tools: ['waf', 'siem', 'honeypot'] }
          },
          max_rounds: 30,
          time_limit: 2400
        },
        {
          id: 3,
          trackId: track.id,
          name: '高级APT攻防',
          description: '模拟高级持续性威胁攻击与防御',
          difficulty: 'hard',
          background_design: '大型企业/政府机构网络环境',
          scene_design: '复杂网络拓扑，多重防御体系',
          objectives: {
            attacker: ['建立持久后门', '数据外泄', '破坏关键基础设施'],
            defender: ['威胁狩猎', '应急响应', '攻击溯源']
          },
          initial_resources: {
            attacker: { action_points: 20, tools: ['custom_malware', 'zero_day', 'c2_server'] },
            defender: { action_points: 20, tools: ['edr', 'ndr', 'soar', 'threat_intel'] }
          },
          max_rounds: 50,
          time_limit: 3600
        }
      ];
      
      setScenarios(mockScenarios);
    } catch (error) {
      message.error('加载场景失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 快速开始
  const handleQuickStart = async () => {
    // 自动选择适合用户等级的场景
    const recommendedTrack = tracks[0] || null;
    if (recommendedTrack) {
      await handleTrackSelect(recommendedTrack);
      const easyScenario = scenarios.find(s => s.difficulty === 'easy');
      if (easyScenario) {
        setSelectedScenario(easyScenario);
        setShowStartModal(true);
      }
    }
  };

  // 开始游戏
  const startGame = async () => {
    if (!selectedScenario) {
      message.warning('请选择一个场景');
      return;
    }

    setLoading(true);
    try {
      const response = await gameApi.initGame(selectedScenario.id, gameMode);
      message.success('游戏创建成功！');
      navigate(`/game/session/${response.sessionId}`);
    } catch (error) {
      message.error('创建游戏失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 渲染统计信息
  const renderStats = () => (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={6}>
        <StatsCard>
          <Statistic
            title="总对局数"
            value={userStats?.total_games || 0}
            prefix={<PlayCircleOutlined />}
          />
        </StatsCard>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <StatsCard>
          <Statistic
            title="胜率"
            value={userStats?.win_rate || 0}
            suffix="%"
            prefix={<TrophyOutlined />}
            valueStyle={{ color: userStats?.win_rate > 50 ? '#52c41a' : '#ff4d4f' }}
          />
        </StatsCard>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <StatsCard>
          <Statistic
            title="擅长角色"
            value={userStats?.favorite_role === 'attacker' ? '攻击方' : '防御方'}
            prefix={userStats?.favorite_role === 'attacker' ? <BugOutlined /> : <SafetyOutlined />}
          />
        </StatsCard>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <StatsCard>
          <Statistic
            title="当前排名"
            value={userStats?.rank || '未排名'}
            prefix={<StarOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </StatsCard>
      </Col>
    </Row>
  );

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <Title level={2} style={{ color: '#00d4ff', marginBottom: 24 }}>
        <RocketOutlined /> 游戏大厅
      </Title>

      {/* 用户统计 */}
      {userStats && renderStats()}

      {/* 快速开始卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <QuickStartCard onClick={handleQuickStart}>
            <div className="quick-start-icon">
              <ThunderboltOutlined />
            </div>
            <Title level={3} style={{ color: '#fff', marginBottom: 8 }}>
              快速开始
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
              系统自动匹配适合您的场景
            </Text>
          </QuickStartCard>
        </Col>
        <Col xs={24} md={8}>
          <QuickStartCard onClick={() => setGameMode('PVP')}>
            <div className="quick-start-icon">
              <TeamOutlined />
            </div>
            <Title level={3} style={{ color: '#fff', marginBottom: 8 }}>
              在线对战
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
              与其他玩家实时对抗
            </Text>
          </QuickStartCard>
        </Col>
        <Col xs={24} md={8}>
          <QuickStartCard onClick={() => navigate('/game/history')}>
            <div className="quick-start-icon">
              <HistoryOutlined />
            </div>
            <Title level={3} style={{ color: '#fff', marginBottom: 8 }}>
              历史记录
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
              查看过往对战记录
            </Text>
          </QuickStartCard>
        </Col>
      </Row>

      {/* 赛道选择 */}
      <StyledCard title="选择赛道" loading={loading}>
        <Row gutter={[16, 16]}>
          {tracks.map(track => (
            <Col xs={24} sm={12} md={8} lg={6} key={track.id}>
              <TrackCard
                hoverable
                onClick={() => handleTrackSelect(track)}
                style={{
                  borderColor: selectedTrack?.id === track.id ? '#00d4ff' : undefined,
                  borderWidth: selectedTrack?.id === track.id ? 2 : 1,
                }}
              >
                <div className="track-icon">
                  {trackIcons[track.name] || <ExperimentOutlined />}
                </div>
                <div className="track-name">{track.name}</div>
                <div className="track-desc">{track.description}</div>
                <div style={{ marginTop: 12 }}>
                  <Tag color="blue">{track.category}</Tag>
                  <Tag color="green">{scenarios.filter(s => s.trackId === track.id).length} 场景</Tag>
                </div>
              </TrackCard>
            </Col>
          ))}
        </Row>
      </StyledCard>

      {/* 场景列表 */}
      {selectedTrack && (
        <StyledCard 
          title={`${selectedTrack.name} - 场景列表`} 
          style={{ marginTop: 24 }}
          loading={loading}
        >
          {scenarios.length > 0 ? (
            <List
              dataSource={scenarios}
              renderItem={scenario => (
                <ScenarioCard key={scenario.id}>
                  <div className="scenario-header">
                    <div>
                      <span className="scenario-name">{scenario.name}</span>
                      <Tag 
                        color={difficultyColors[scenario.difficulty]} 
                        style={{ marginLeft: 8 }}
                      >
                        {difficultyLabels[scenario.difficulty]}
                      </Tag>
                    </div>
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={() => {
                        setSelectedScenario(scenario);
                        setShowStartModal(true);
                      }}
                    >
                      选择场景
                    </Button>
                  </div>
                  <div className="scenario-desc">{scenario.description}</div>
                  <Space wrap>
                    <Tag icon={<ClockCircleOutlined />}>
                      {scenario.max_rounds} 回合
                    </Tag>
                    {scenario.time_limit && (
                      <Tag icon={<ClockCircleOutlined />}>
                        {Math.floor(scenario.time_limit / 60)} 分钟
                      </Tag>
                    )}
                    <Tag icon={<FireOutlined />}>
                      攻击方 {scenario.initial_resources.attacker.action_points} AP
                    </Tag>
                    <Tag icon={<SafetyOutlined />}>
                      防御方 {scenario.initial_resources.defender.action_points} AP
                    </Tag>
                  </Space>
                </ScenarioCard>
              )}
            />
          ) : (
            <Empty description="该赛道暂无场景" />
          )}
        </StyledCard>
      )}

      {/* 开始游戏模态框 */}
      <Modal
        title="游戏设置"
        visible={showStartModal}
        onOk={startGame}
        onCancel={() => setShowStartModal(false)}
        confirmLoading={loading}
        width={600}
      >
        {selectedScenario && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <Title level={4}>{selectedScenario.name}</Title>
              <Paragraph>{selectedScenario.description}</Paragraph>
              <Paragraph>
                <Text strong>背景设定：</Text>
                {selectedScenario.background_design}
              </Paragraph>
              <Paragraph>
                <Text strong>场景设计：</Text>
                {selectedScenario.scene_design}
              </Paragraph>
            </Card>

            <Card title="游戏模式" style={{ marginBottom: 16 }}>
              <Radio.Group 
                value={gameMode} 
                onChange={e => setGameMode(e.target.value)}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Radio value="PVE">
                    <Space>
                      <RobotOutlined />
                      <Text strong>人机对战</Text>
                      <Text type="secondary">与AI对手进行对战</Text>
                    </Space>
                  </Radio>
                  <Radio value="PVP">
                    <Space>
                      <TeamOutlined />
                      <Text strong>玩家对战</Text>
                      <Text type="secondary">与其他玩家实时对抗</Text>
                    </Space>
                  </Radio>
                </Space>
              </Radio.Group>
            </Card>

            <Card title="目标" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong style={{ color: '#ff4d4f' }}>
                    <BugOutlined /> 攻击方目标：
                  </Text>
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    {selectedScenario.objectives.attacker.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </Col>
                <Col span={12}>
                  <Text strong style={{ color: '#52c41a' }}>
                    <SafetyOutlined /> 防御方目标：
                  </Text>
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    {selectedScenario.objectives.defender.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GameLobby;