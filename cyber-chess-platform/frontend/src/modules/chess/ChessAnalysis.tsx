// src/modules/chess/ChessAnalysis.tsx
import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Tabs, Timeline } from 'antd';
import { LineChart, BarChart, PieChart } from '@/components/charts';
import styled from 'styled-components';

const { TabPane } = Tabs;

const AnalysisContainer = styled.div`
  padding: 20px;
`;

const MetricCard = styled(Card)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.2);
  
  .ant-statistic-title {
    color: rgba(255, 255, 255, 0.65);
  }
  
  .ant-statistic-content {
    color: #00d4ff;
  }
`;

interface ChessAnalysisProps {
  chessId: string;
}

export const ChessAnalysis: React.FC<ChessAnalysisProps> = ({ chessId }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // 模拟数据
  const damageData = {
    labels: ['回合1', '回合2', '回合3', '回合4', '回合5'],
    datasets: [
      {
        label: '攻击方伤害',
        data: [20, 35, 45, 60, 75],
        borderColor: '#ff0080',
      },
      {
        label: '防守方恢复',
        data: [10, 15, 20, 25, 30],
        borderColor: '#00ff88',
      },
    ],
  };

  const tacticUsage = {
    labels: ['APT侦察', '0day攻击', 'DDoS', '社会工程', '供应链攻击'],
    datasets: [
      {
        label: '使用次数',
        data: [5, 3, 2, 4, 1],
      },
    ],
  };

  const roleDistribution = {
    labels: ['攻击时间', '防守时间', '监管时间'],
    datasets: [
      {
        data: [45, 35, 20],
      },
    ],
  };

  return (
    <AnalysisContainer>
      <Card title="📊 棋谱分析" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="总览" key="overview">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <MetricCard>
                  <Statistic title="总回合数" value={15} suffix="回合" />
                </MetricCard>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <MetricCard>
                  <Statistic title="总伤害" value={285} prefix="⚡" />
                </MetricCard>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <MetricCard>
                  <Statistic title="战术使用" value={15} suffix="次" />
                </MetricCard>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <MetricCard>
                  <Statistic title="胜率预测" value={68.5} suffix="%" precision={1} />
                </MetricCard>
              </Col>
            </Row>
            
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
              <Col xs={24} lg={12}>
                <Card title="伤害趋势" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                  <LineChart data={damageData} height={300} />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="战术使用分布" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                  <BarChart data={tacticUsage} height={300} />
                </Card>
              </Col>
            </Row>
          </TabPane>
          
          <TabPane tab="战术分析" key="tactics">
            <Table 
              columns={[
                { title: '战术名称', dataIndex: 'name', key: 'name' },
                { title: '使用次数', dataIndex: 'count', key: 'count' },
                { title: '成功率', dataIndex: 'success', key: 'success', render: (val) => `${val}%` },
                { title: '平均伤害', dataIndex: 'damage', key: 'damage' },
                { title: '评级', dataIndex: 'rating', key: 'rating', render: (val) => <Tag color="blue">{val}</Tag> },
              ]}
              dataSource={[
                { key: 1, name: 'APT侦察', count: 5, success: 100, damage: 0, rating: 'A' },
                { key: 2, name: '0day攻击', count: 3, success: 66, damage: 40, rating: 'S' },
                { key: 3, name: 'DDoS攻击', count: 2, success: 50, damage: 25, rating: 'B' },
              ]}
              pagination={false}
            />
          </TabPane>
          
          <TabPane tab="时间分析" key="time">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="角色时间分配" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                  <PieChart data={roleDistribution} height={300} />
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title="关键时间点" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                  <Timeline mode="left">
                    <Timeline.Item color="green">游戏开始</Timeline.Item>
                    <Timeline.Item color="blue">首次0day攻击 (回合3)</Timeline.Item>
                    <Timeline.Item color="red">系统崩溃 (回合8)</Timeline.Item>
                    <Timeline.Item color="orange">紧急修复 (回合10)</Timeline.Item>
                    <Timeline.Item color="purple">游戏结束 (回合15)</Timeline.Item>
                  </Timeline>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>
    </AnalysisContainer>
  );
};

export default ChessAnalysis;