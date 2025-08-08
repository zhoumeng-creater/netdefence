// =====================================================
// 管理后台核心文件 - Admin Module Core Files
// =====================================================

// src/modules/admin/Dashboard.tsx
import React from 'react';
import { Card, Row, Col, Statistic, Progress } from 'antd';
import { UserOutlined, BookOutlined, DatabaseOutlined, TrophyOutlined } from '@ant-design/icons';
import { LineChart, BarChart, PieChart } from '@/components/charts';
import styled from 'styled-components';

const DashboardCard = styled(Card)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.2);
`;

export const Dashboard: React.FC = () => {
  // 模拟数据
  const userGrowthData = {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
    datasets: [
      {
        label: '新增用户',
        data: [120, 150, 180, 220, 280, 350],
      },
    ],
  };

  return (
    <div>
      <h2 style={{ color: '#00d4ff', marginBottom: 24 }}>📊 管理仪表板</h2>
      
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <DashboardCard>
            <Statistic
              title="总用户数"
              value={1234}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#00d4ff' }}
            />
            <Progress percent={75} strokeColor="#00d4ff" />
          </DashboardCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <DashboardCard>
            <Statistic
              title="课程数量"
              value={56}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#00ff88' }}
            />
            <Progress percent={60} strokeColor="#00ff88" />
          </DashboardCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <DashboardCard>
            <Statistic
              title="棋谱总数"
              value={789}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#ffd700' }}
            />
            <Progress percent={85} strokeColor="#ffd700" />
          </DashboardCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <DashboardCard>
            <Statistic
              title="今日活跃"
              value={234}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#ff0080' }}
            />
            <Progress percent={45} strokeColor="#ff0080" />
          </DashboardCard>
        </Col>
      </Row>

      {/* 图表 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="用户增长趋势" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
            <LineChart data={userGrowthData} height={300} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="系统状态" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ padding: 20 }}>
              <p>🟢 系统运行正常</p>
              <p>CPU使用率: 45%</p>
              <p>内存使用: 2.3GB / 8GB</p>
              <p>存储空间: 120GB / 500GB</p>
              <p>活跃连接: 234</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;