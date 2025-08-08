import React from 'react';
import { Card, Row, Col, Typography, Timeline, Tag, Space } from 'antd';
import {
  RocketOutlined,
  SafetyOutlined,
  TeamOutlined,
  TrophyOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';

const { Title, Paragraph, Text } = Typography;

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const HeroSection = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 0, 128, 0.05));
  border-radius: 16px;
  margin-bottom: 40px;
`;

const HeroTitle = styled.h1`
  font-size: 42px;
  font-weight: bold;
  background: linear-gradient(90deg, #00d4ff, #ff0080);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 20px;
`;

const FeatureCard = styled(Card)`
  height: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    border-color: #00d4ff;
    box-shadow: 0 10px 30px rgba(0, 212, 255, 0.2);
  }
`;

const About: React.FC = () => {
  const features = [
    {
      icon: <RocketOutlined style={{ fontSize: 48, color: '#00d4ff' }} />,
      title: '创新玩法',
      description: '将网络安全知识与策略游戏完美结合，在娱乐中学习，在对抗中成长。',
    },
    {
      icon: <SafetyOutlined style={{ fontSize: 48, color: '#ff0080' }} />,
      title: '真实场景',
      description: '基于真实的网络安全事件和攻防技术，提供最贴近实战的学习体验。',
    },
    {
      icon: <TeamOutlined style={{ fontSize: 48, color: '#00ff88' }} />,
      title: '社区驱动',
      description: '活跃的安全爱好者社区，分享经验、交流技术、共同进步。',
    },
    {
      icon: <TrophyOutlined style={{ fontSize: 48, color: '#ffd700' }} />,
      title: '竞技排名',
      description: '完善的竞技系统和排名机制，展示你的安全技能，赢得荣誉和认可。',
    },
  ];

  const timeline = [
    {
      date: '2024.01',
      title: '项目启动',
      description: '网络安全棋谱对抗系统正式立项',
      color: 'blue',
    },
    {
      date: '2024.03',
      title: 'Alpha版本',
      description: '完成核心游戏机制开发',
      color: 'green',
    },
    {
      date: '2024.06',
      title: 'Beta测试',
      description: '开放公测，收集用户反馈',
      color: 'orange',
    },
    {
      date: '2024.09',
      title: '正式发布',
      description: '1.0版本正式上线',
      color: 'red',
    },
    {
      date: '2024.12',
      title: '重大更新',
      description: '推出课程系统和安全事件库',
      color: 'purple',
    },
  ];

  return (
    <PageContainer>
      <HeroSection>
        <ThunderboltOutlined style={{ fontSize: 80, color: '#00d4ff', marginBottom: 20 }} />
        <HeroTitle>关于 Cyber Chess</HeroTitle>
        <Paragraph style={{ fontSize: 18, color: 'rgba(255, 255, 255, 0.85)', maxWidth: 800, margin: '0 auto' }}>
          Cyber Chess 是一个创新的网络安全教育平台，通过游戏化的方式让学习网络安全变得有趣而高效。
          我们相信，最好的学习方式是在实践中学习，在对抗中成长。
        </Paragraph>
      </HeroSection>

      <Card
        title={<span style={{ fontSize: 24, color: '#00d4ff' }}>平台特色</span>}
        style={{ marginBottom: 40, background: 'rgba(255, 255, 255, 0.02)' }}
      >
        <Row gutter={[24, 24]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <FeatureCard>
                <div style={{ textAlign: 'center', padding: 20 }}>
                  {feature.icon}
                  <Title level={4} style={{ color: '#00d4ff', marginTop: 16 }}>
                    {feature.title}
                  </Title>
                  <Paragraph style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                    {feature.description}
                  </Paragraph>
                </div>
              </FeatureCard>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card
            title={<span style={{ fontSize: 20, color: '#00d4ff' }}>发展历程</span>}
            style={{ background: 'rgba(255, 255, 255, 0.02)' }}
          >
            <Timeline mode="left">
              {timeline.map((item, index) => (
                <Timeline.Item key={index} color={item.color}>
                  <div>
                    <Text strong style={{ color: '#00d4ff' }}>{item.date}</Text>
                    <Title level={5} style={{ color: 'rgba(255, 255, 255, 0.85)', margin: '8px 0' }}>
                      {item.title}
                    </Title>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                      {item.description}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={<span style={{ fontSize: 20, color: '#00d4ff' }}>技术栈</span>}
            style={{ background: 'rgba(255, 255, 255, 0.02)', marginBottom: 24 }}
          >
            <Space size={[8, 16]} wrap>
              <Tag color="blue">React</Tag>
              <Tag color="green">TypeScript</Tag>
              <Tag color="orange">Redux</Tag>
              <Tag color="purple">WebSocket</Tag>
              <Tag color="cyan">Node.js</Tag>
              <Tag color="magenta">PostgreSQL</Tag>
              <Tag color="red">Redis</Tag>
              <Tag color="gold">Docker</Tag>
            </Space>
          </Card>

          <Card
            title={<span style={{ fontSize: 20, color: '#00d4ff' }}>联系我们</span>}
            style={{ background: 'rgba(255, 255, 255, 0.02)' }}
          >
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
              <GlobalOutlined /> 官方网站：www.cyberchess.com
            </Paragraph>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
              📧 联系邮箱：contact@cyberchess.com
            </Paragraph>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
              💬 技术支持：support@cyberchess.com
            </Paragraph>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
              🐛 问题反馈：feedback@cyberchess.com
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default About;