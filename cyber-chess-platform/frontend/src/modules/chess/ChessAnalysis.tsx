// 文件路径：frontend/src/modules/chess/ChessAnalysis.tsx
// 状态：修改现有文件（原文件为空实现）

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Tabs,
  Timeline,
  Tag,
  Progress,
  List,
  Space,
  Typography,
  Alert,
  Statistic,
  Tooltip,
  Badge,
  Spin,
  Button,
  Divider,
  message
} from 'antd';
import {
  RadarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  BulbOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
  FireOutlined,
  RiseOutlined,
  FallOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// 样式组件
const AnalysisContainer = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  padding: 24px;
`;

const MetricCard = styled(Card)`
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(255, 0, 128, 0.05));
  border: 1px solid rgba(0, 212, 255, 0.2);
  height: 100%;
  
  .ant-card-body {
    padding: 16px;
  }
`;

const InsightCard = styled.div`
  background: rgba(0, 212, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  transition: all 0.3s;
  
  &:hover {
    background: rgba(0, 212, 255, 0.08);
    border-color: rgba(0, 212, 255, 0.4);
    transform: translateY(-2px);
  }
`;

const TimelineCard = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 212, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
`;

// 类型定义
interface AnalysisData {
  summary: {
    winner: string;
    totalRounds: number;
    duration: number;
    attackerScore: number;
    defenderScore: number;
    efficiency: number;
  };
  metrics: {
    attackMetrics: MetricData;
    defenseMetrics: MetricData;
    resourceMetrics: ResourceData;
  };
  timeline: TimelineEvent[];
  insights: InsightData[];
  recommendations: RecommendationData[];
  heatmap: HeatmapData[];
}

interface MetricData {
  successRate: number;
  averageDamage: number;
  criticalHits: number;
  totalActions: number;
  effectiveActions: number;
  tacticDistribution: { name: string; value: number }[];
}

interface ResourceData {
  efficiency: number;
  waste: number;
  utilization: { name: string; value: number }[];
}

interface TimelineEvent {
  round: number;
  type: 'critical' | 'turning_point' | 'opportunity' | 'mistake';
  description: string;
  impact: number;
}

interface InsightData {
  type: 'strength' | 'weakness' | 'pattern' | 'anomaly';
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
}

interface RecommendationData {
  category: string;
  suggestion: string;
  difficulty: 'easy' | 'medium' | 'hard';
  impact: number;
}

interface HeatmapData {
  round: number;
  attackerActivity: number;
  defenderActivity: number;
  intensity: number;
}

interface ChessAnalysisProps {
  chessId: string;
}

export const ChessAnalysis: React.FC<ChessAnalysisProps> = ({ chessId }) => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (chessId) {
      fetchAnalysisData();
    }
  }, [chessId]);

  const fetchAnalysisData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chess/${chessId}/analysis`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setAnalysisData(result.data);
      } else {
        message.error('获取分析数据失败');
      }
    } catch (error) {
      console.error('获取分析数据失败:', error);
      message.error('获取分析数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="AI正在分析棋谱..." />
        </div>
      </Card>
    );
  }

  if (!analysisData) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Text>无法加载分析数据</Text>
          <br />
          <Button onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
            返回
          </Button>
        </div>
      </Card>
    );
  }

  // 图表颜色配置
  const COLORS = ['#00d4ff', '#ff0080', '#00ff88', '#ffd700', '#ff6b6b'];

  // 雷达图数据
  const radarData = [
    { subject: '攻击力', A: analysisData.metrics.attackMetrics.successRate, fullMark: 100 },
    { subject: '防御力', A: analysisData.metrics.defenseMetrics.successRate, fullMark: 100 },
    { subject: '资源管理', A: analysisData.metrics.resourceMetrics.efficiency, fullMark: 100 },
    { subject: '战术运用', A: analysisData.summary.efficiency, fullMark: 100 },
    { subject: '决策质量', A: 85, fullMark: 100 }
  ];

  // 趋势图数据
  const trendData = analysisData.heatmap.map(item => ({
    round: `R${item.round}`,
    攻击强度: item.attackerActivity,
    防御强度: item.defenderActivity,
    对抗激烈度: item.intensity
  }));

  return (
    <AnalysisContainer>
      <Title level={2} style={{ marginBottom: 24 }}>
        <RadarChartOutlined /> AI棋谱分析报告
      </Title>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* 总览标签页 */}
        <TabPane 
          tab={<span><PieChartOutlined /> 总览</span>} 
          key="overview"
        >
          <Row gutter={[16, 16]}>
            {/* 关键指标卡片 */}
            <Col xs={24} sm={12} md={6}>
              <MetricCard>
                <Statistic
                  title="对战结果"
                  value={analysisData.summary.winner === 'attacker' ? '攻击方胜' : '防守方胜'}
                  valueStyle={{ 
                    color: analysisData.summary.winner === 'attacker' ? '#ff4d4f' : '#1890ff',
                    fontSize: 20 
                  }}
                  prefix={<TrophyOutlined />}
                />
              </MetricCard>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <MetricCard>
                <Statistic
                  title="战斗效率"
                  value={analysisData.summary.efficiency}
                  suffix="%"
                  valueStyle={{ color: '#00d4ff' }}
                  prefix={<ThunderboltOutlined />}
                />
                <Progress 
                  percent={analysisData.summary.efficiency} 
                  strokeColor="#00d4ff"
                  showInfo={false}
                  size="small"
                />
              </MetricCard>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <MetricCard>
                <Statistic
                  title="总回合数"
                  value={analysisData.summary.totalRounds}
                  valueStyle={{ color: '#00ff88' }}
                />
                <Text type="secondary">
                  用时: {Math.floor(analysisData.summary.duration / 60)}分钟
                </Text>
              </MetricCard>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <MetricCard>
                <Statistic
                  title="最终比分"
                  value={`${analysisData.summary.attackerScore} : ${analysisData.summary.defenderScore}`}
                  valueStyle={{ color: '#ffd700' }}
                />
              </MetricCard>
            </Col>

            {/* 雷达图 */}
            <Col xs={24} md={12}>
              <Card title="能力雷达图">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(0, 212, 255, 0.3)" />
                    <PolarAngleAxis dataKey="subject" stroke="#00d4ff" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="能力值"
                      dataKey="A"
                      stroke="#00d4ff"
                      fill="#00d4ff"
                      fillOpacity={0.3}
                    />
                    <ChartTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* 战术分布饼图 */}
            <Col xs={24} md={12}>
              <Card title="战术使用分布">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analysisData.metrics.attackMetrics.tacticDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analysisData.metrics.attackMetrics.tacticDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* 对战趋势标签页 */}
        <TabPane 
          tab={<span><LineChartOutlined /> 对战趋势</span>} 
          key="trends"
        >
          <Card title="对战强度变化">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAttack" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4d4f" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ff4d4f" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorDefense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1890ff" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="round" stroke="#00d4ff" />
                <YAxis stroke="#00d4ff" />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
                <ChartTooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="攻击强度"
                  stroke="#ff4d4f"
                  fillOpacity={1}
                  fill="url(#colorAttack)"
                />
                <Area
                  type="monotone"
                  dataKey="防御强度"
                  stroke="#1890ff"
                  fillOpacity={1}
                  fill="url(#colorDefense)"
                />
                <Line
                  type="monotone"
                  dataKey="对抗激烈度"
                  stroke="#ffd700"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* 关键时刻时间线 */}
          <Card title="关键时刻" style={{ marginTop: 16 }}>
            <Timeline mode="alternate">
              {analysisData.timeline.map((event, index) => (
                <Timeline.Item
                  key={index}
                  color={
                    event.type === 'critical' ? 'red' :
                    event.type === 'turning_point' ? 'gold' :
                    event.type === 'opportunity' ? 'green' : 'gray'
                  }
                  label={`第${event.round}回合`}
                >
                  <TimelineCard>
                    <Space direction="vertical" size="small">
                      <Tag color={
                        event.type === 'critical' ? 'red' :
                        event.type === 'turning_point' ? 'gold' :
                        event.type === 'opportunity' ? 'green' : 'default'
                      }>
                        {event.type === 'critical' ? '关键时刻' :
                         event.type === 'turning_point' ? '转折点' :
                         event.type === 'opportunity' ? '机会' : '失误'}
                      </Tag>
                      <Text>{event.description}</Text>
                      <Progress
                        percent={event.impact}
                        size="small"
                        strokeColor={event.impact > 70 ? '#ff4d4f' : '#00d4ff'}
                        format={percent => `影响度: ${percent}%`}
                      />
                    </Space>
                  </TimelineCard>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </TabPane>

        {/* AI洞察标签页 */}
        <TabPane 
          tab={<span><BulbOutlined /> AI洞察</span>} 
          key="insights"
        >
          <Row gutter={[16, 16]}>
            {/* 优势分析 */}
            <Col xs={24} md={12}>
              <Card 
                title={<Space><CheckCircleOutlined style={{ color: '#52c41a' }} /> 优势分析</Space>}
              >
                <List
                  dataSource={analysisData.insights.filter(i => i.type === 'strength')}
                  renderItem={insight => (
                    <InsightCard>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space>
                          <Badge 
                            status={
                              insight.importance === 'high' ? 'error' :
                              insight.importance === 'medium' ? 'warning' : 'default'
                            }
                          />
                          <Text strong>{insight.title}</Text>
                        </Space>
                        <Paragraph style={{ margin: 0 }}>
                          {insight.description}
                        </Paragraph>
                      </Space>
                    </InsightCard>
                  )}
                />
              </Card>
            </Col>

            {/* 弱点分析 */}
            <Col xs={24} md={12}>
              <Card 
                title={<Space><CloseCircleOutlined style={{ color: '#ff4d4f' }} /> 弱点分析</Space>}
              >
                <List
                  dataSource={analysisData.insights.filter(i => i.type === 'weakness')}
                  renderItem={insight => (
                    <InsightCard>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space>
                          <Badge 
                            status={
                              insight.importance === 'high' ? 'error' :
                              insight.importance === 'medium' ? 'warning' : 'default'
                            }
                          />
                          <Text strong>{insight.title}</Text>
                        </Space>
                        <Paragraph style={{ margin: 0 }}>
                          {insight.description}
                        </Paragraph>
                      </Space>
                    </InsightCard>
                  )}
                />
              </Card>
            </Col>

            {/* 模式识别 */}
            <Col xs={24}>
              <Card 
                title={<Space><InfoCircleOutlined style={{ color: '#1890ff' }} /> 行为模式</Space>}
              >
                <List
                  dataSource={analysisData.insights.filter(i => i.type === 'pattern')}
                  renderItem={insight => (
                    <InsightCard>
                      <Alert
                        message={insight.title}
                        description={insight.description}
                        type="info"
                        showIcon
                      />
                    </InsightCard>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* 改进建议标签页 */}
        <TabPane 
          tab={<span><RiseOutlined /> 改进建议</span>} 
          key="recommendations"
        >
          <List
            grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
            dataSource={analysisData.recommendations}
            renderItem={item => (
              <List.Item>
                <Card
                  title={
                    <Space>
                      <FireOutlined style={{ color: '#ff6b6b' }} />
                      {item.category}
                    </Space>
                  }
                  extra={
                    <Tag color={
                      item.difficulty === 'easy' ? 'green' :
                      item.difficulty === 'medium' ? 'orange' : 'red'
                    }>
                      {item.difficulty === 'easy' ? '简单' :
                       item.difficulty === 'medium' ? '中等' : '困难'}
                    </Tag>
                  }
                >
                  <Paragraph>{item.suggestion}</Paragraph>
                  <Divider style={{ margin: '12px 0' }} />
                  <Space>
                    <Text type="secondary">预期提升:</Text>
                    <Progress
                      type="circle"
                      percent={item.impact}
                      width={50}
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                    />
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>
    </AnalysisContainer>
  );
};

export default ChessAnalysis;