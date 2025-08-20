// 文件路径：frontend/src/modules/community/Leaderboard.tsx
// 状态：修改现有文件（增强功能）

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Avatar,
  Tag,
  Select,
  Space,
  Empty,
  Spin,
  Row,
  Col,
  Statistic,
  Progress,
  Tabs,
  Button,
  Typography,
  Badge,
  Tooltip,
  Segmented
} from 'antd';
import {
  TrophyOutlined,
  CrownOutlined,
  FireOutlined,
  RiseOutlined,
  FallOutlined,
  UserOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  StarOutlined,
  ClockCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// 样式组件
const LeaderboardContainer = styled.div`
  .top-three {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    margin-bottom: 32px;
    padding: 24px;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(0, 212, 255, 0.1));
    border-radius: 16px;
  }
`;

const TopPlayerCard = styled.div<{ rank: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  margin: 0 16px;
  background: ${props => 
    props.rank === 1 ? 'linear-gradient(135deg, #ffd700, #ffed4e)' :
    props.rank === 2 ? 'linear-gradient(135deg, #c0c0c0, #e8e8e8)' :
    'linear-gradient(135deg, #cd7f32, #d4a574)'
  };
  border-radius: 12px;
  width: ${props => props.rank === 1 ? '200px' : '180px'};
  transform: ${props => props.rank === 1 ? 'scale(1.1)' : 'scale(1)'};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  
  .rank-badge {
    font-size: ${props => props.rank === 1 ? '48px' : '36px'};
    color: #fff;
    margin-bottom: 8px;
  }
  
  .player-avatar {
    margin-bottom: 12px;
    border: 3px solid #fff;
  }
  
  .player-name {
    color: #fff;
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 4px;
  }
  
  .player-score {
    color: rgba(255, 255, 255, 0.9);
    font-size: 20px;
    font-weight: bold;
  }
`;

const StatCard = styled(Card)`
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(255, 0, 128, 0.05));
  border: 1px solid rgba(0, 212, 255, 0.2);
  
  .ant-statistic-title {
    color: rgba(255, 255, 255, 0.65);
  }
  
  .ant-statistic-content {
    color: #00d4ff;
  }
`;

const RankBadge = styled.div<{ rank: number }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-weight: bold;
  background: ${props =>
    props.rank === 1 ? 'linear-gradient(135deg, #ffd700, #ffed4e)' :
    props.rank === 2 ? 'linear-gradient(135deg, #c0c0c0, #e8e8e8)' :
    props.rank === 3 ? 'linear-gradient(135deg, #cd7f32, #d4a574)' :
    'rgba(0, 212, 255, 0.1)'
  };
  color: ${props => props.rank <= 3 ? '#fff' : '#00d4ff'};
`;

// 类型定义
interface LeaderboardPlayer {
  rank: number;
  rankChange?: number;
  user: {
    id: string;
    username: string;
    avatar?: string;
    level?: number;
  };
  totalScore: number;
  gamesPlayed: number;
  winRate: number;
  avgScore: number;
  streak?: number;
  achievements?: string[];
  role?: string;
}

interface LeaderboardStats {
  totalPlayers: number;
  activeToday: number;
  avgScore: number;
  topScore: number;
}

export const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overall');
  const [data, setData] = useState<LeaderboardPlayer[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    fetchLeaderboard();
    fetchStats();
    fetchTrendData();
  }, [period, roleFilter, activeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period,
        ...(roleFilter !== 'all' && { role: roleFilter }),
        type: activeTab
      });
      
      const response = await fetch(`/api/game/leaderboard?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        // 添加模拟的额外数据
        const enhancedData = (result.data || []).map((item: any, index: number) => ({
          ...item,
          rankChange: Math.floor(Math.random() * 10) - 5,
          winRate: 50 + Math.floor(Math.random() * 40),
          avgScore: Math.floor(item.totalScore / (item.gamesPlayed || 1)),
          streak: Math.floor(Math.random() * 10),
          achievements: ['首胜', '十连胜', '大师'].slice(0, Math.floor(Math.random() * 3) + 1),
          role: ['attacker', 'defender', 'monitor'][Math.floor(Math.random() * 3)]
        }));
        setData(enhancedData);
      }
    } catch (error) {
      console.error('获取排行榜失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // 模拟统计数据
    setStats({
      totalPlayers: 1234,
      activeToday: 456,
      avgScore: 2850,
      topScore: 9999
    });
  };

  const fetchTrendData = async () => {
    // 模拟趋势数据
    const mockTrend = Array.from({ length: 7 }, (_, i) => ({
      day: `Day ${i + 1}`,
      avgScore: 2000 + Math.random() * 1000,
      players: 100 + Math.floor(Math.random() * 50)
    }));
    setTrendData(mockTrend);
  };

  // 表格列定义
  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 100,
      fixed: 'left' as const,
      render: (rank: number, record: LeaderboardPlayer) => (
        <Space>
          <RankBadge rank={rank}>
            {rank === 1 ? <CrownOutlined /> :
             rank === 2 ? <TrophyOutlined /> :
             rank === 3 ? <TrophyOutlined /> : rank}
          </RankBadge>
          {record.rankChange !== undefined && record.rankChange !== 0 && (
            <span style={{ fontSize: 12 }}>
              {record.rankChange > 0 ? (
                <Text type="success">
                  <RiseOutlined /> {record.rankChange}
                </Text>
              ) : (
                <Text type="danger">
                  <FallOutlined /> {Math.abs(record.rankChange)}
                </Text>
              )}
            </span>
          )}
        </Space>
      ),
    },
    {
      title: '玩家',
      dataIndex: 'user',
      key: 'user',
      width: 200,
      render: (user: any, record: LeaderboardPlayer) => (
        <Space>
          <Badge
            count={record.streak && record.streak > 3 ? 
              <FireOutlined style={{ color: '#ff6b6b' }} /> : 0
            }
          >
            <Avatar 
              style={{ backgroundColor: '#00d4ff', cursor: 'pointer' }}
              onClick={() => navigate(`/user/profile/${user.id}`)}
            >
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          </Badge>
          <div>
            <div>
              <Text strong style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/user/profile/${user.id}`)}>
                {user?.username || '未知玩家'}
              </Text>
              {user?.level && (
                <Tag color="gold" style={{ marginLeft: 8 }}>
                  Lv.{user.level}
                </Tag>
              )}
            </div>
            {record.role && (
              <Tag color={
                record.role === 'attacker' ? 'red' :
                record.role === 'defender' ? 'blue' : 'green'
              } style={{ fontSize: 10 }}>
                {record.role === 'attacker' ? '攻击者' :
                 record.role === 'defender' ? '防守者' : '监管者'}
              </Tag>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 120,
      sorter: (a: any, b: any) => a.totalScore - b.totalScore,
      render: (score: number) => (
        <Text strong style={{ fontSize: 16, color: '#ffd700' }}>
          {score.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '场次',
      dataIndex: 'gamesPlayed',
      key: 'gamesPlayed',
      width: 100,
      render: (games: number) => (
        <Badge count={games} showZero style={{ backgroundColor: '#52c41a' }} />
      ),
    },
    {
      title: '胜率',
      dataIndex: 'winRate',
      key: 'winRate',
      width: 120,
      render: (rate: number) => (
        <Tooltip title={`胜率: ${rate}%`}>
          <Progress
            percent={rate}
            size="small"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </Tooltip>
      ),
    },
    {
      title: '平均分',
      dataIndex: 'avgScore',
      key: 'avgScore',
      width: 100,
      render: (score: number) => (
        <Text>{score.toLocaleString()}</Text>
      ),
    },
    {
      title: '成就',
      dataIndex: 'achievements',
      key: 'achievements',
      width: 150,
      render: (achievements: string[]) => (
        <Space size={4}>
          {achievements?.slice(0, 3).map((achievement, index) => (
            <Tooltip key={index} title={achievement}>
              <StarOutlined style={{ color: '#ffd700', fontSize: 16 }} />
            </Tooltip>
          ))}
          {achievements?.length > 3 && (
            <Text type="secondary">+{achievements.length - 3}</Text>
          )}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: LeaderboardPlayer) => (
        <Space>
          <Button 
            type="link" 
            size="small"
            onClick={() => navigate(`/user/profile/${record.user.id}`)}
          >
            查看
          </Button>
          <Button 
            type="link" 
            size="small"
            onClick={() => navigate(`/game/history?userId=${record.user.id}`)}
          >
            战绩
          </Button>
        </Space>
      ),
    },
  ];

  // 获取前三名数据
  const topThree = data.slice(0, 3);

  return (
    <LeaderboardContainer>
      <Title level={2} style={{ marginBottom: 24 }}>
        <TrophyOutlined style={{ marginRight: 8, color: '#ffd700' }} />
        排行榜
      </Title>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard>
            <Statistic
              title="总玩家数"
              value={stats?.totalPlayers || 0}
              prefix={<TeamOutlined />}
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard>
            <Statistic
              title="今日活跃"
              value={stats?.activeToday || 0}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard>
            <Statistic
              title="平均分数"
              value={stats?.avgScore || 0}
              prefix={<BarChartOutlined />}
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard>
            <Statistic
              title="最高分"
              value={stats?.topScore || 0}
              prefix={<CrownOutlined />}
              valueStyle={{ color: '#ffd700' }}
            />
          </StatCard>
        </Col>
      </Row>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        tabBarExtraContent={
          <Space>
            <Segmented
              value={period}
              onChange={setPeriod}
              options={[
                { label: '总榜', value: 'all' },
                { label: '月榜', value: 'monthly' },
                { label: '周榜', value: 'weekly' },
                { label: '日榜', value: 'daily' }
              ]}
            />
            <Select
              value={roleFilter}
              onChange={setRoleFilter}
              style={{ width: 120 }}
              placeholder="筛选角色"
            >
              <Select.Option value="all">全部角色</Select.Option>
              <Select.Option value="attacker">攻击者</Select.Option>
              <Select.Option value="defender">防守者</Select.Option>
              <Select.Option value="monitor">监管者</Select.Option>
            </Select>
          </Space>
        }
      >
        <TabPane tab="综合排行" key="overall">
          {/* 前三名展示 */}
          {topThree.length === 3 && !loading && (
            <div className="top-three">
              {[topThree[1], topThree[0], topThree[2]].map((player, index) => {
                const actualRank = index === 1 ? 1 : index === 0 ? 2 : 3;
                return (
                  <TopPlayerCard key={player.user.id} rank={actualRank}>
                    <div className="rank-badge">
                      {actualRank === 1 ? '👑' : actualRank === 2 ? '🥈' : '🥉'}
                    </div>
                    <Avatar
                      size={actualRank === 1 ? 80 : 64}
                      className="player-avatar"
                      style={{ backgroundColor: '#00d4ff' }}
                    >
                      {player.user.username[0]?.toUpperCase()}
                    </Avatar>
                    <div className="player-name">{player.user.username}</div>
                    <div className="player-score">{player.totalScore.toLocaleString()}</div>
                    <Progress
                      type="circle"
                      percent={player.winRate}
                      width={60}
                      strokeColor="#fff"
                      trailColor="rgba(255,255,255,0.3)"
                    />
                  </TopPlayerCard>
                );
              })}
            </div>
          )}

          {/* 排行榜表格 */}
          <Card>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
              </div>
            ) : data.length === 0 ? (
              <Empty description="暂无排行数据" />
            ) : (
              <Table
                columns={columns}
                dataSource={data}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 名玩家`
                }}
                rowKey={(record) => record.user.id}
                scroll={{ x: 1200 }}
              />
            )}
          </Card>
        </TabPane>

        <TabPane tab="分数趋势" key="trends">
          <Card title="近7日平均分数趋势">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
                <XAxis dataKey="day" stroke="#00d4ff" />
                <YAxis stroke="#00d4ff" />
                <ChartTooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="avgScore"
                  name="平均分数"
                  stroke="#00d4ff"
                  fillOpacity={1}
                  fill="url(#colorScore)"
                />
                <Line
                  type="monotone"
                  dataKey="players"
                  name="活跃玩家"
                  stroke="#ff6b6b"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </TabPane>

        <TabPane tab="成就榜" key="achievements">
          <Card>
            <Empty description="成就系统开发中..." />
          </Card>
        </TabPane>
      </Tabs>
    </LeaderboardContainer>
  );
};

export default Leaderboard;