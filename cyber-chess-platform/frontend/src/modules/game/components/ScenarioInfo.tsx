/**
 * 场景信息展示组件
 * 用于展示游戏场景的背景、目标、胜利条件等信息
 */
import React, { useState } from 'react';
import { 
  Descriptions, 
  Tag, 
  Alert, 
  Card, 
  Row, 
  Col, 
  Timeline,
  Space,
  Divider,
  Typography,
  Collapse,
  List,
  Badge
} from 'antd';
import {
  InfoCircleOutlined,
  AimOutlined,
  BugOutlined,
  SafetyOutlined,
  FireOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  BookOutlined,
  FlagOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// 场景信息接口
interface ScenarioInfoProps {
  scenario: {
    id?: number;
    name: string;
    difficulty?: number;
    background_design?: string;
    scene_design?: string;
    target_design?: any;
    elements?: string[];
    attack_steps?: any[];
    penetration_methods?: string[];
    defense_config?: any;
    initial_infrastructure?: any;
    vulnerabilities?: any[];
    win_conditions?: any;
  };
  showFullDetails?: boolean;
  onRoleSelect?: (role: 'attacker' | 'defender') => void;
}

// 难度星级组件
const DifficultyStars: React.FC<{ level: number }> = ({ level }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} style={{ color: i <= level ? '#faad14' : '#d9d9d9' }}>
        ★
      </span>
    );
  }
  return <span>{stars}</span>;
};

const ScenarioInfo: React.FC<ScenarioInfoProps> = ({ 
  scenario, 
  showFullDetails = false,
  onRoleSelect 
}) => {
  const [activeKey, setActiveKey] = useState<string | string[]>(['1', '2']);

  // 渲染攻击步骤
  const renderAttackSteps = () => {
    if (!scenario.attack_steps || scenario.attack_steps.length === 0) {
      return <Text type="secondary">暂无攻击步骤信息</Text>;
    }

    return (
      <Timeline mode="left">
        {scenario.attack_steps.map((step: any, index: number) => (
          <Timeline.Item
            key={index}
            color={
            scenario.attack_steps && index === 0 ? 'green' : 
            scenario.attack_steps && index === scenario.attack_steps.length - 1 ? 'red' : 
            'blue'
            }
            dot={<ClockCircleOutlined />}
          >
            <Card size="small" hoverable>
              <div style={{ marginBottom: '4px' }}>
                <Tag color="blue">第 {step.step || index + 1} 步</Tag>
                <strong>{step.name}</strong>
              </div>
              <Text type="secondary">{step.description}</Text>
            </Card>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  // 渲染漏洞信息
  const renderVulnerabilities = () => {
    if (!scenario.vulnerabilities || scenario.vulnerabilities.length === 0) {
      return <Text type="secondary">暂无漏洞信息</Text>;
    }

    return (
      <List
        size="small"
        dataSource={scenario.vulnerabilities}
        renderItem={(vuln: any) => (
          <List.Item>
            <Space>
              <BugOutlined style={{ color: '#ff4d4f' }} />
              <Text strong>{vuln.type}</Text>
              <Tag color={
                vuln.severity === 'high' ? 'red' : 
                vuln.severity === 'medium' ? 'orange' : 'green'
              }>
                {vuln.severity === 'high' ? '高危' : 
                 vuln.severity === 'medium' ? '中危' : '低危'}
              </Tag>
              <Text type="secondary">位置: {vuln.location}</Text>
            </Space>
          </List.Item>
        )}
      />
    );
  };

  // 渲染基础设施
  const renderInfrastructure = () => {
    if (!scenario.initial_infrastructure) {
      return <Text type="secondary">暂无基础设施信息</Text>;
    }

    return (
      <Row gutter={[8, 8]}>
        {Object.entries(scenario.initial_infrastructure).map(([key, value]: [string, any]) => (
          <Col span={8} key={key}>
            <Card size="small" hoverable>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{key.replace(/_/g, ' ').toUpperCase()}</Text>
                <Badge 
                  status={value.status === 'running' ? 'processing' : 'default'} 
                  text={value.status}
                />
                {value.vulnerability && (
                  <Tag color={
                    value.vulnerability === 'high' ? 'red' : 
                    value.vulnerability === 'medium' ? 'orange' : 'green'
                  }>
                    风险: {value.vulnerability}
                  </Tag>
                )}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div className="scenario-info">
      {/* 场景标题 */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Title level={3}>
          <FireOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
          {scenario.name}
        </Title>
        {scenario.difficulty && (
          <div>
            <Text type="secondary">难度等级: </Text>
            <DifficultyStars level={scenario.difficulty} />
          </div>
        )}
      </div>

      {/* 场景背景 */}
      <Alert
        message={
          <Space>
            <InfoCircleOutlined />
            <span>场景背景</span>
          </Space>
        }
        description={
          <Paragraph>
            {scenario.background_design || '在这个场景中，你将体验真实的网络安全攻防对抗。'}
          </Paragraph>
        }
        type="info"
        showIcon={false}
        style={{ marginBottom: '16px' }}
      />

      {/* 场景说明 */}
      <Alert
        message={
          <Space>
            <AimOutlined />
            <span>对战目标</span>
          </Space>
        }
        description={
          <Paragraph>
            {scenario.scene_design || '选择你的角色，运用攻防工具，达成你的目标。'}
          </Paragraph>
        }
        type="warning"
        showIcon={false}
        style={{ marginBottom: '16px' }}
      />

      {/* 胜利条件 */}
      {scenario.win_conditions && (
        <Card 
          title={<><FlagOutlined /> 胜利条件</>} 
          size="small" 
          style={{ marginBottom: '16px' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Card 
                type="inner" 
                title={<><BugOutlined style={{ color: '#ff4d4f' }} /> 攻击方</>}
                size="small"
                style={{ borderColor: '#ff4d4f' }}
              >
                {scenario.win_conditions.attacker?.map((condition: string, index: number) => (
                  <div key={index} style={{ marginBottom: '4px' }}>
                    <CheckCircleOutlined style={{ color: '#ff4d4f', marginRight: '4px' }} />
                    <Text>{condition}</Text>
                  </div>
                ))}
              </Card>
            </Col>
            <Col span={12}>
              <Card 
                type="inner" 
                title={<><SafetyOutlined style={{ color: '#52c41a' }} /> 防御方</>}
                size="small"
                style={{ borderColor: '#52c41a' }}
              >
                {scenario.win_conditions.defender?.map((condition: string, index: number) => (
                  <div key={index} style={{ marginBottom: '4px' }}>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
                    <Text>{condition}</Text>
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {/* 关键要素 */}
      {scenario.elements && scenario.elements.length > 0 && (
        <Card 
          title={<><BookOutlined /> 关键要素</>} 
          size="small" 
          style={{ marginBottom: '16px' }}
        >
          <Space wrap>
            {scenario.elements.map((element, index) => (
              <Tag 
                key={index} 
                color="blue" 
                icon={<ToolOutlined />}
                style={{ margin: '4px' }}
              >
                {element}
              </Tag>
            ))}
          </Space>
        </Card>
      )}

      {/* 详细信息（可折叠） */}
      {showFullDetails && (
        <Collapse 
          activeKey={activeKey}
          onChange={setActiveKey}
          style={{ marginTop: '16px' }}
        >
          {/* 攻击步骤 */}
          {scenario.attack_steps && scenario.attack_steps.length > 0 && (
            <Panel 
              header={<><ThunderboltOutlined /> 攻击步骤</>} 
              key="1"
            >
              {renderAttackSteps()}
            </Panel>
          )}

          {/* 渗透方法 */}
          {scenario.penetration_methods && scenario.penetration_methods.length > 0 && (
            <Panel 
              header={<><BugOutlined /> 可用攻击方法</>} 
              key="2"
            >
              <Space wrap>
                {scenario.penetration_methods.map((method, index) => (
                  <Tag key={index} color="red" icon={<FireOutlined />}>
                    {method}
                  </Tag>
                ))}
              </Space>
            </Panel>
          )}

          {/* 防御配置 */}
          {scenario.defense_config && (
            <Panel 
              header={<><SafetyOutlined /> 防御配置</>} 
              key="3"
            >
              <Descriptions bordered size="small" column={1}>
                {scenario.defense_config.initial_tools && (
                  <Descriptions.Item label="初始工具">
                    <Space wrap>
                      {scenario.defense_config.initial_tools.map((tool: string, index: number) => (
                        <Tag key={index} color="green">{tool}</Tag>
                      ))}
                    </Space>
                  </Descriptions.Item>
                )}
                {scenario.defense_config.defense_layers && (
                  <Descriptions.Item label="防御层级">
                    <Space wrap>
                      {scenario.defense_config.defense_layers.map((layer: string, index: number) => (
                        <Tag key={index} color="blue">{layer}</Tag>
                      ))}
                    </Space>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Panel>
          )}

          {/* 基础设施 */}
          {scenario.initial_infrastructure && (
            <Panel 
              header={<><WarningOutlined /> 基础设施状态</>} 
              key="4"
            >
              {renderInfrastructure()}
            </Panel>
          )}

          {/* 漏洞信息 */}
          {scenario.vulnerabilities && scenario.vulnerabilities.length > 0 && (
            <Panel 
              header={
                <>
                  <BugOutlined /> 已知漏洞
                  <Badge 
                    count={scenario.vulnerabilities.length} 
                    style={{ marginLeft: '8px' }}
                  />
                </>
              } 
              key="5"
            >
              {renderVulnerabilities()}
            </Panel>
          )}
        </Collapse>
      )}

      {/* 角色选择提示 */}
      {onRoleSelect && (
        <Card 
          style={{ marginTop: '16px', textAlign: 'center', background: '#f0f2f5' }}
        >
          <Title level={5}>选择你的角色开始游戏</Title>
          <Space size="large">
            <Card
              hoverable
              style={{ cursor: 'pointer', borderColor: '#ff4d4f' }}
              onClick={() => onRoleSelect('attacker')}
            >
              <BugOutlined style={{ fontSize: '32px', color: '#ff4d4f' }} />
              <div style={{ marginTop: '8px' }}>
                <Text strong>攻击方</Text>
              </div>
              <Text type="secondary">利用漏洞，突破防御</Text>
            </Card>
            
            <Card
              hoverable
              style={{ cursor: 'pointer', borderColor: '#52c41a' }}
              onClick={() => onRoleSelect('defender')}
            >
              <SafetyOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
              <div style={{ marginTop: '8px' }}>
                <Text strong>防御方</Text>
              </div>
              <Text type="secondary">保护系统，阻止入侵</Text>
            </Card>
          </Space>
        </Card>
      )}
    </div>
  );
};

export default ScenarioInfo;