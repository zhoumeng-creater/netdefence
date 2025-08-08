import React from 'react';
import { Row, Col, Card, Statistic, Button, Space, Badge, Progress, Typography } from 'antd';
import {
  PlayCircleOutlined,
  DatabaseOutlined,
  BookOutlined,
  TrophyOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  FireOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { LineChart, BarChart, PieChart } from '@/components/charts';
import { useAuth } from '@/hooks/useAuth';

const { Title, Text, Paragraph } = Typography;

const HeroSection = styled.div`
  margin-bottom: 40px;
  padding: 60px 40px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 0, 128, 0.05));
  border-radius: 16px;
  border: 1px solid rgba(0, 212, 255, 0.2);
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%);
    animation: rotate 20s linear infinite;
  }
  
  @keyframes rotate {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const HeroTitle = styled.h1`
  font-size: 48px;
  font-weight: bold;
  background: linear-gradient(90deg, #00d4ff, #ff0080, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    font-size: 32px;
  }
`;

const HeroDescription = styled.p`
  font-size: 18px;
  color: rgba(255, 255, 255, 0.85);
  max-width: 600px;
  margin: 0 auto 30px;
  position: relative;
  z-index: 1;
`;

const StatsCard = styled(Card)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.2);
  height: 100%;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    border-color: #00d4ff;
    box-shadow: 0 10px 30px rgba(0, 212, 255, 0.2);
  }
  
  .ant-statistic-title {
    color: rgba(255, 255, 255, 0.65);
  }
  
  .ant-statistic-content {
    color: #00d4ff;
  }
`;

const ActionCard = styled(Card)`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  height: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    border-color: #00d4ff;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 0, 128, 0.05));
  }
`;

const ActivityItem = styled.div`
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.02);
  border-left: 3px solid #00d4ff;
  border-radius: 4px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 212, 255, 0.05);
  }
`;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, getDisplayName } = useAuth();

  // 模拟数据
  const weeklyData = {
    labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    datasets: [
      {
        label: '对战次数',
        data: [12, 19, 15, 25, 22, 30, 28],
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
      },
      {
        label: '胜利次数',
        data: [8, 12, 10, 18, 15, 22, 20],
        borderColor: '#00ff88',
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
      },
    ],
  };

  const roleDistribution = {
    labels: ['攻击方', '防守方', '监管者'],
    datasets: [
      {
        data: [45, 35, 20],
        backgroundColor: [
          'rgba(255, 0, 128, 0.8)',
          'rgba(0, 212, 255, 0.8)',
          'rgba(255, 215, 0, 0.8)',
        ],
      },
    ],
  };

  const difficultyStats = {
    labels: ['入门', '初级', '中级', '高级', '专家'],
    datasets: [
      {
        label: '完成课程',
        data: [15, 12, 8, 5, 2],
      },
    ],
  };

  const recentActivities = [
    { type: 'game', content: '完成了一场精彩的对战', time: '5分钟前', icon: '🎮' },
    { type: 'chess', content: '上传了新的棋谱', time: '1小时前', icon: '♟️' },
    { type: 'course', content: '完成了"Web安全基础"课程', time: '3小时前', icon: '📚' },
    { type: 'achievement', content: '解锁成就：网络守护者', time: '1天前', icon: '🏆' },
    { type: 'event', content: '参与了安全事件分析', time: '2天前', icon: '🔍' },
  ];

  return (
    <div>
      <HeroSection>
        <HeroTitle>
          <ThunderboltOutlined /> 欢迎来到网络安全棋谱对抗系统
        </HeroTitle>
        <HeroDescription>
          {user && `欢迎回来，${getDisplayName()}！`}
          在这里，您可以通过游戏化的方式学习网络安全知识，
          与其他玩家进行对抗，提升您的安全技能。
        </HeroDescription>
        <Space size="large">
          <Button
            type="primary"
            size="large"
            icon={<RocketOutlined />}
            onClick={() => navigate('/game')}
            style={{
              background: 'linear-gradient(90deg, #00d4ff, #0099cc)',
              border: 'none',
              height: '45px',
            }}
          >
            开始游戏
          </Button>
          <Button
            size="large"
            icon={<BookOutlined />}
            onClick={() => navigate('/course')}
            style={{
              background: 'transparent',
              border: '1px solid #ff0080',
              color: '#ff0080',
              height: '45px',
            }}
          >
            浏览课程
          </Button>
        </Space>
      </HeroSection>

      {/* 统计数据 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <StatsCard>
            <Statistic
              title="今日对战"
              value={8}
              prefix={<PlayCircleOutlined />}
              suffix="场"
            />
            <Progress percent={80} strokeColor="#00d4ff" showInfo={false} />
          </StatsCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatsCard>
            <Statistic
              title="胜率"
              value={68.5}
              prefix={<TrophyOutlined />}
              suffix="%"
              precision={1}
            />
            <Progress percent={68.5} strokeColor="#00ff88" showInfo={false} />
          </StatsCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatsCard>
            <Statistic
              title="棋谱收藏"
              value={156}
              prefix={<DatabaseOutlined />}
            />
            <Progress percent={45} strokeColor="#ffd700" showInfo={false} />
          </StatsCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatsCard>
            <Statistic
              title="积分排名"
              value={42}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#ff0080' }}
            />
            <Progress percent={90} strokeColor="#ff0080" showInfo={false} />
          </StatsCard>
        </Col>
      </Row>

      {/* 图表展示 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title="本周对战统计"
            extra={<Badge status="processing" text="实时更新" />}
            style={{ background: 'rgba(255, 255, 255, 0.02)' }}
          >
            <LineChart data={weeklyData} height={300} />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card
            title="角色偏好"
            style={{ background: 'rgba(255, 255, 255, 0.02)' }}
          >
            <PieChart data={roleDistribution} height={300} />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card
            title="课程完成度"
            style={{ background: 'rgba(255, 255, 255, 0.02)' }}
          >
            <BarChart data={difficultyStats} height={300} showLegend={false} />
          </Card>
        </Col>
      </Row>

      {/* 快速操作和最新动态 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={<span><FireOutlined /> 快速操作</span>}
            style={{ background: 'rgba(255, 255, 255, 0.02)' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={12} md={6}>
                <ActionCard onClick={() => navigate('/game/play')}>
                  <div style={{ textAlign: 'center' }}>
                    <RocketOutlined style={{ fontSize: 32, color: '#00d4ff' }} />
                    <div style={{ marginTop: 8 }}>快速匹配</div>
                  </div>
                </ActionCard>
              </Col>
              <Col xs={12} md={6}>
                <ActionCard onClick={() => navigate('/chess/upload')}>
                  <div style={{ textAlign: 'center' }}>
                    <DatabaseOutlined style={{ fontSize: 32, color: '#ff0080' }} />
                    <div style={{ marginTop: 8 }}>上传棋谱</div>
                  </div>
                </ActionCard>
              </Col>
              <Col xs={12} md={6}>
                <ActionCard onClick={() => navigate('/course')}>
                  <div style={{ textAlign: 'center' }}>
                    <BookOutlined style={{ fontSize: 32, color: '#00ff88' }} />
                    <div style={{ marginTop: 8 }}>学习课程</div>
                  </div>
                </ActionCard>
              </Col>
              <Col xs={12} md={6}>
                <ActionCard onClick={() => navigate('/events')}>
                  <div style={{ textAlign: 'center' }}>
                    <ThunderboltOutlined style={{ fontSize: 32, color: '#ffd700' }} />
                    <div style={{ marginTop: 8 }}>安全事件</div>
                  </div>
                </ActionCard>
              </Col>
            </Row>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card
            title="最新动态"
            style={{ background: 'rgba(255, 255, 255, 0.02)' }}
          >
            {recentActivities.map((activity, index) => (
              <ActivityItem key={index}>
                <Space>
                  <span style={{ fontSize: 20 }}>{activity.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div>{activity.content}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {activity.time}
                    </Text>
                  </div>
                </Space>
              </ActivityItem>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;