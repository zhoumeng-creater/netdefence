/**
 * RITE评分面板组件
 * 显示零信任、风险归零、零事故、零损失四个维度的评分
 */
import React, { useEffect, useState } from 'react';
import { Card, Progress, Row, Col, Statistic, Tooltip, Tag } from 'antd';
import {
  SafetyOutlined,
  AlertOutlined,
  BugOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import './RITEScorePanel.css';

interface RITEScores {
  trust: number;      // 零信任 (Trust)
  risk: number;       // 风险归零 (Risk)
  incident: number;   // 零事故 (Incident)
  loss: number;       // 零损失 (Energy/Loss)
}

interface RITEScorePanelProps {
  scores: RITEScores;
  showTrend?: boolean;
  previousScores?: RITEScores;
  compact?: boolean;
}

const RITEScorePanel: React.FC<RITEScorePanelProps> = ({
  scores,
  showTrend = false,
  previousScores,
  compact = false
}) => {
  const [animatedScores, setAnimatedScores] = useState<RITEScores>(scores);
  const [trends, setTrends] = useState<Record<string, 'up' | 'down' | 'stable'>>({});

  // 动画效果
  useEffect(() => {
    const animationDuration = 500;
    const steps = 20;
    const interval = animationDuration / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setAnimatedScores({
          trust: Math.round(scores.trust * currentStep / steps),
          risk: Math.round(scores.risk * currentStep / steps),
          incident: Math.round(scores.incident * currentStep / steps),
          loss: Math.round(scores.loss * currentStep / steps)
        });
      } else {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [scores]);

  // 计算趋势
  useEffect(() => {
    if (showTrend && previousScores) {
      setTrends({
        trust: scores.trust > previousScores.trust ? 'up' : 
               scores.trust < previousScores.trust ? 'down' : 'stable',
        risk: scores.risk > previousScores.risk ? 'up' : 
              scores.risk < previousScores.risk ? 'down' : 'stable',
        incident: scores.incident > previousScores.incident ? 'up' : 
                  scores.incident < previousScores.incident ? 'down' : 'stable',
        loss: scores.loss > previousScores.loss ? 'up' : 
              scores.loss < previousScores.loss ? 'down' : 'stable'
      });
    }
  }, [scores, previousScores, showTrend]);

  // 获取分数颜色
  const getScoreColor = (score: number, type: string) => {
    // 对于防御方，分数越高越好
    if (score >= 80) return '#52c41a'; // 绿色 - 优秀
    if (score >= 60) return '#1890ff'; // 蓝色 - 良好
    if (score >= 40) return '#faad14'; // 橙色 - 一般
    return '#f5222d'; // 红色 - 危险
  };

  // 获取状态图标
  const getStatusIcon = (score: number) => {
    if (score >= 80) return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    if (score >= 40) return <WarningOutlined style={{ color: '#faad14' }} />;
    return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
  };

  // 获取趋势图标
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <RiseOutlined style={{ color: '#52c41a' }} />;
    if (trend === 'down') return <FallOutlined style={{ color: '#f5222d' }} />;
    return null;
  };

  // 计算综合分数
  const overallScore = Math.round(
    (animatedScores.trust + animatedScores.risk + 
     animatedScores.incident + animatedScores.loss) / 4
  );

  // 获取综合评级
  const getOverallRating = (score: number) => {
    if (score >= 85) return { text: 'S', color: '#722ed1' };
    if (score >= 75) return { text: 'A', color: '#52c41a' };
    if (score >= 65) return { text: 'B', color: '#1890ff' };
    if (score >= 55) return { text: 'C', color: '#faad14' };
    if (score >= 45) return { text: 'D', color: '#fa8c16' };
    return { text: 'F', color: '#f5222d' };
  };

  const rating = getOverallRating(overallScore);

  // 定义四个维度
  const dimensions = [
    {
      key: 'trust',
      name: '零信任',
      icon: <SafetyOutlined />,
      description: '身份验证与访问控制',
      value: animatedScores.trust,
      color: '#1890ff'
    },
    {
      key: 'risk',
      name: '风险归零',
      icon: <AlertOutlined />,
      description: '系统漏洞与风险管理',
      value: animatedScores.risk,
      color: '#52c41a'
    },
    {
      key: 'incident',
      name: '零事故',
      icon: <BugOutlined />,
      description: '安全事件与威胁防护',
      value: animatedScores.incident,
      color: '#fa8c16'
    },
    {
      key: 'loss',
      name: '零损失',
      icon: <DollarOutlined />,
      description: '数据保护与损失预防',
      value: animatedScores.loss,
      color: '#eb2f96'
    }
  ];

  if (compact) {
    // 紧凑模式
    return (
      <Card className="rite-score-panel-compact" size="small">
        <Row gutter={8}>
          {dimensions.map(dim => (
            <Col span={6} key={dim.key}>
              <Tooltip title={dim.description}>
                <div className="compact-score">
                  <div className="score-icon">{dim.icon}</div>
                  <Progress
                    type="circle"
                    percent={dim.value}
                    width={50}
                    strokeColor={getScoreColor(dim.value, dim.key)}
                    format={() => dim.value}
                  />
                  <div className="score-label">{dim.name}</div>
                </div>
              </Tooltip>
            </Col>
          ))}
        </Row>
      </Card>
    );
  }

  // 完整模式
  return (
    <Card 
      title="RITE 安全评分" 
      className="rite-score-panel"
      extra={
        <div className="overall-rating">
          <span className="rating-label">综合评级:</span>
          <Tag color={rating.color} style={{ fontSize: '18px', padding: '4px 12px' }}>
            {rating.text}
          </Tag>
          <span className="overall-score">{overallScore}</span>
        </div>
      }
    >
      <Row gutter={[16, 16]}>
        {dimensions.map(dim => (
          <Col span={12} key={dim.key}>
            <Card size="small" className="dimension-card">
              <div className="dimension-header">
                <span className="dimension-icon" style={{ color: dim.color }}>
                  {dim.icon}
                </span>
                <span className="dimension-name">{dim.name}</span>
                {showTrend && trends[dim.key] && (
                  <span className="dimension-trend">
                    {getTrendIcon(trends[dim.key])}
                  </span>
                )}
              </div>
              
              <Tooltip title={dim.description}>
                <Progress
                  percent={dim.value}
                  strokeColor={getScoreColor(dim.value, dim.key)}
                  status="active"
                />
              </Tooltip>
              
              <div className="dimension-footer">
                <span className="score-value">{dim.value}</span>
                <span className="score-status">
                  {getStatusIcon(dim.value)}
                </span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      
      {/* 评分解释 */}
      <div className="score-explanation">
        <Row gutter={8}>
          <Col span={6}>
            <Tag color="success">80-100 优秀</Tag>
          </Col>
          <Col span={6}>
            <Tag color="processing">60-79 良好</Tag>
          </Col>
          <Col span={6}>
            <Tag color="warning">40-59 一般</Tag>
          </Col>
          <Col span={6}>
            <Tag color="error">0-39 危险</Tag>
          </Col>
        </Row>
      </div>
      
      {/* 综合分析 */}
      <div className="score-analysis">
        <Statistic
          title="综合得分"
          value={overallScore}
          suffix="/ 100"
          valueStyle={{ color: getScoreColor(overallScore, 'overall') }}
        />
        <div className="analysis-text">
          {overallScore >= 80 && '系统安全状态优秀，继续保持！'}
          {overallScore >= 60 && overallScore < 80 && '系统安全状态良好，仍有提升空间。'}
          {overallScore >= 40 && overallScore < 60 && '系统存在一定风险，需要加强防护。'}
          {overallScore < 40 && '系统安全状态危急，请立即采取行动！'}
        </div>
      </div>
    </Card>
  );
};

export default RITEScorePanel;