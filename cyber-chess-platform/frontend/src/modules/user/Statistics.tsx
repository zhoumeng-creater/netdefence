// 文件路径：frontend/src/modules/user/Statistics.tsx
// 状态：新建文件（原文件可能为空或不存在）

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Space,
  Statistic,
  Typography,
  Table,
  Tag,
  Progress,
  Empty,
  Spin,
  Button
} from 'antd';
import {
  LineChartOutlined,
  BarChartOutlined,
  RiseOutlined,
  FallOutlined,
  TrophyOutlined,
  FireOutlined,
  ClockCircleOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import {
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieLabelRenderProps
} from 'recharts';
import { useAppSelector } from '@/store';
import dayjs, { Dayjs } from 'dayjs';
import moment from 'moment';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 样式组件
const StatisticsContainer = styled.div`
  .stat-card {
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(255, 0, 128, 0.05));
    border: 1px solid rgba(0, 212, 255, 0.2);
    height: 100%;
  }
  
  .chart-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(0, 212, 255, 0.2);
  }
`;

const SummaryCard = styled(Card)`
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 0, 128, 0.1));
  border: 1px solid rgba(0, 212, 255, 0.3);
  
  .ant-statistic-title {
    color: rgba(255, 255, 255, 0.85);
    font-weight: 500;
  }
  
  .ant-statistic-content {
    color: #00d4ff;
    font-size: 28px;
  }
`;

const TrendIndicator = styled.span<{ trend: 'up' | 'down' | 'stable' }>`
  color: ${props => 
    props.trend === 'up' ? '#52c41a' : 
    props.trend === 'down' ? '#ff4d4f' : '#faad14'
  };
  font-size: 14px;
  margin-left: 8px;
`;

// 类型定义
interface StatisticsData {
  summary: {
    totalGames: number;
    winRate: number;
    avgScore: number;
    totalPlayTime: number;
    trend: {
      games: number;
      winRate: number;
      score: number;
    };
  };
  dailyStats: Array<{
    date: string;
    games: number;
    wins: number;
    losses: number;
    score: number;
  }>;
  roleDistribution: Array<{
    name: string;
    value: number;
  }>;
  tacticUsage: Array<{
    name: string;
    usage: number;
    successRate: number;
  }>;
  performanceRadar: Array<{
    subject: string;
    value: number;
    fullMark: number;
  }>;
  recentGames: Array<{
    id: string;
    date: string;
    role: string;
    result: string;
    score: number;
    duration: number;
  }>;
}

interface PieChartEntry {
  name: string;
  percent: number;
}

export const Statistics: React.FC = () => {
  const currentUser = useAppSelector(state => state.auth.user);
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatisticsData | null>(null);
  const [timeRange, setTimeRange] = useState('week');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);

  useEffect(() => {
    fetchStatistics();
  }, [timeRange, dateRange]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // 获取真实的游戏统计
      const response = await fetch('/api/game/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      let realStats = null;
      if (response.ok) {
        const result = await response.json();
        realStats = result.data;
      }

      // 生成模拟数据（结合真实数据）
      const mockData: StatisticsData = {
        summary: {
          totalGames: realStats?.totalGames || 156,
          winRate: realStats?.winRate || 58.5,
          avgScore: realStats?.averageScore || 2847,
          totalPlayTime: 4320, // 分钟
          trend: {
            games: 12,
            winRate: 3.2,
            score: -120
          }
        },
        dailyStats: generateDailyStats(),
        roleDistribution: [
          { name: '攻击者', value: 45 },
          { name: '防守者', value: 35 },
          { name: '监管者', value: 20 }
        ],
        tacticUsage: generateTacticUsage(),
        performanceRadar: [
          { subject: '攻击', value: 85, fullMark: 100 },
          { subject: '防御', value: 72, fullMark: 100 },
          { subject: '策略', value: 90, fullMark: 100 },
          { subject: '资源管理', value: 68, fullMark: 100 },
          { subject: '时机把握', value: 88, fullMark: 100 },
          { subject: '适应能力', value: 75, fullMark: 100 }
        ],
        recentGames: generateRecentGames()
      };

      setData(mockData);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };
  // 修改日期处理函数
  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
      // 重新加载数据
      Statistics([dates[0], dates[1]]);
    }
  };

  const generateDailyStats = () => {
    return Array.from({ length: 7 }, (_, i) => ({
      date: moment().subtract(6 - i, 'days').format('MM-DD'),
      games: Math.floor(Math.random() * 10) + 5,
      wins: Math.floor(Math.random() * 8),
      losses: Math.floor(Math.random() * 5),
      score: Math.floor(Math.random() * 1000) + 2000
    }));
  };

  const generateTacticUsage = () => {
    const tactics = ['快速突击', '层层防御', '资源控制', '混合战术', '心理战'];
    return tactics.map(name => ({
      name,
      usage: Math.floor(Math.random() * 100) + 20,
      successRate: Math.floor(Math.random() * 40) + 50
    }));
  };

  const generateRecentGames = () => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `game-${i}`,
      date: moment().subtract(i, 'days').format('YYYY-MM-DD'),
      role: ['攻击者', '防守者', '监管者'][Math.floor(Math.random() * 3)],
      result: ['胜利', '失败', '平局'][Math.floor(Math.random() * 3)],
      score: Math.floor(Math.random() * 2000) + 1000,
      duration: Math.floor(Math.random() * 60) + 20
    }));
  };

  const handleExport = () => {
    // 导出数据功能
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `statistics_${moment().format('YYYY-MM-DD')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="加载统计数据..." />
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <Empty description="暂无统计数据" />
      </Card>
    );
  }

  const COLORS = ['#00d4ff', '#ff0080', '#00ff88', '#ffd700', '#ff6b6b'];

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => <Text>{date}</Text>
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={
          role === '攻击者' ? 'red' :
          role === '防守者' ? 'blue' : 'green'
        }>
          {role}
        </Tag>
      )
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => (
        <Tag color={
          result === '胜利' ? 'success' :
          result === '失败' ? 'error' : 'warning'
        }>
          {result}
        </Tag>
      )
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <Text strong style={{ color: '#ffd700' }}>{score}</Text>
      )
    },
    {
      title: '用时',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => `${duration}分钟`
    }
  ];

  return (
    <StatisticsContainer>
      <Card
        title={
          <Space>
            <BarChartOutlined style={{ color: '#00d4ff' }} />
            数据统计中心
          </Space>
        }
        extra={
          <Space>
            <Select
              value={timeRange}
              onChange={setTimeRange}
              style={{ width: 120 }}
            >
              <Select.Option value="day">今日</Select.Option>
              <Select.Option value="week">本周</Select.Option>
              <Select.Option value="month">本月</Select.Option>
              <Select.Option value="year">本年</Select.Option>
              <Select.Option value="all">全部</Select.Option>
            </Select>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange as any}
            />
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出数据
            </Button>
          </Space>
        }
      >
        {/* 总览卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <SummaryCard>
              <Statistic
                title="总场次"
                value={data.summary.totalGames}
                prefix={<TrophyOutlined />}
                suffix={
                  <TrendIndicator trend={data.summary.trend.games > 0 ? 'up' : 'down'}>
                    {data.summary.trend.games > 0 ? <RiseOutlined /> : <FallOutlined />}
                    {Math.abs(data.summary.trend.games)}
                  </TrendIndicator>
                }
              />
            </SummaryCard>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <SummaryCard>
              <Statistic
                title="胜率"
                value={data.summary.winRate}
                precision={1}
                suffix="%"
                prefix={<FireOutlined />}
                valueStyle={{ 
                  color: data.summary.winRate > 50 ? '#52c41a' : '#ff4d4f' 
                }}
              />
              <Progress
                percent={data.summary.winRate}
                strokeColor={data.summary.winRate > 50 ? '#52c41a' : '#ff4d4f'}
                showInfo={false}
              />
            </SummaryCard>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <SummaryCard>
              <Statistic
                title="平均得分"
                value={data.summary.avgScore}
                prefix={<LineChartOutlined />}
                suffix={
                  <TrendIndicator trend={data.summary.trend.score > 0 ? 'up' : 'down'}>
                    {data.summary.trend.score > 0 ? <RiseOutlined /> : <FallOutlined />}
                    {Math.abs(data.summary.trend.score)}
                  </TrendIndicator>
                }
              />
            </SummaryCard>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <SummaryCard>
              <Statistic
                title="游戏时长"
                value={Math.floor(data.summary.totalPlayTime / 60)}
                suffix="小时"
                prefix={<ClockCircleOutlined />}
              />
            </SummaryCard>
          </Col>
        </Row>

        {/* 图表区域 */}
        <Row gutter={[16, 16]}>
          {/* 每日趋势图 */}
          <Col xs={24} lg={12}>
            <Card title="每日对战趋势" className="chart-card">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.dailyStats}>
                  <defs>
                    <linearGradient id="colorGames" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffd700" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ffd700" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
                  <XAxis dataKey="date" stroke="#00d4ff" />
                  <YAxis stroke="#00d4ff" />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="games"
                    name="场次"
                    stroke="#00d4ff"
                    fillOpacity={1}
                    fill="url(#colorGames)"
                  />
                  <Line
                    type="monotone"
                    dataKey="wins"
                    name="胜场"
                    stroke="#52c41a"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* 角色分布饼图 */}
          <Col xs={24} lg={12}>
            <Card title="角色使用分布" className="chart-card">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.roleDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: PieLabelRenderProps) => {
                      const { name, percent } = props;
                      if (typeof percent === 'number' && name) {
                        return `${name} ${(percent * 100).toFixed(0)}%`;
                      }
                      return '';
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* 能力雷达图 */}
          <Col xs={24} lg={12}>
            <Card title="综合能力分析" className="chart-card">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={data.performanceRadar}>
                  <PolarGrid stroke="rgba(0, 212, 255, 0.3)" />
                  <PolarAngleAxis dataKey="subject" stroke="#00d4ff" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="能力值"
                    dataKey="value"
                    stroke="#00d4ff"
                    fill="#00d4ff"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* 战术使用统计 */}
          <Col xs={24} lg={12}>
            <Card title="战术使用统计" className="chart-card">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.tacticUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
                  <XAxis dataKey="name" stroke="#00d4ff" />
                  <YAxis stroke="#00d4ff" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="usage" name="使用次数" fill="#00d4ff" />
                  <Bar dataKey="successRate" name="成功率%" fill="#00ff88" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* 最近对战记录 */}
        <Card title="最近对战记录" style={{ marginTop: 16 }} className="chart-card">
          <Table
            columns={columns}
            dataSource={data.recentGames}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        </Card>
      </Card>
    </StatisticsContainer>
  );
};

export default Statistics;