/**
 * 防御工具箱组件
 * 基于"八个打"的防御工具选择界面
 */
import React, { useState, useEffect } from 'react';
import { Card, Tooltip, Badge, Row, Col, Tag, Divider, message } from 'antd';
import {
  SafetyOutlined,
  EyeOutlined,
  MedicineBoxOutlined,
  RadarChartOutlined,
  CompassOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  LockOutlined
} from '@ant-design/icons';
import './DefenseToolbox.css';

// 八个打防御方法定义
const EIGHT_STRIKES = {
  // 基础防御
  patch: {
    name: '打补丁',
    icon: '🩹',
    description: '修复漏洞、系统更新',
    color: '#52c41a',
    category: 'basic',
    tools: [
      { id: 'system_update', name: '系统更新', cost: 1, cooldown: 0 },
      { id: 'vuln_fix', name: '漏洞修复', cost: 1, cooldown: 0 },
      { id: 'emergency_patch', name: '紧急补丁', cost: 2, cooldown: 1 }
    ]
  },
  firewall: {
    name: '打苍蝇',
    icon: '🛡️',
    description: '防火墙、IDS/IPS',
    color: '#1890ff',
    category: 'basic',
    tools: [
      { id: 'waf', name: 'WAF防护', cost: 2, cooldown: 0 },
      { id: 'network_firewall', name: '网络防火墙', cost: 2, cooldown: 0 },
      { id: 'app_firewall', name: '应用防火墙', cost: 3, cooldown: 1 }
    ]
  },
  monitor: {
    name: '打地鼠',
    icon: '👁️',
    description: '监控检测、异常发现',
    color: '#fa8c16',
    category: 'basic',
    tools: [
      { id: 'ids', name: '入侵检测', cost: 2, cooldown: 0 },
      { id: 'siem', name: 'SIEM系统', cost: 3, cooldown: 1 },
      { id: 'behavior_analysis', name: '行为分析', cost: 3, cooldown: 1 }
    ]
  },
  vaccine: {
    name: '打疫苗',
    icon: '💊',
    description: '主动免疫、预防防护',
    color: '#eb2f96',
    category: 'basic',
    tools: [
      { id: 'antivirus', name: '防病毒系统', cost: 2, cooldown: 0 },
      { id: 'immune_system', name: '免疫系统', cost: 3, cooldown: 1 },
      { id: 'sandbox', name: '沙箱隔离', cost: 3, cooldown: 1 }
    ]
  },
  // 先进防御
  ambush: {
    name: '打埋伏',
    icon: '🍯',
    description: '蜜罐陷阱、诱捕系统',
    color: '#722ed1',
    category: 'advanced',
    tools: [
      { id: 'honeypot', name: '蜜罐系统', cost: 3, cooldown: 1 },
      { id: 'trap_vuln', name: '陷阱漏洞', cost: 3, cooldown: 1 },
      { id: 'decoy_system', name: '诱饵系统', cost: 4, cooldown: 2 }
    ]
  },
  decoy: {
    name: '打边鼓',
    icon: '🎭',
    description: '欺骗防御、误导攻击',
    color: '#13c2c2',
    category: 'advanced',
    tools: [
      { id: 'deception', name: '欺骗防御', cost: 2, cooldown: 0 },
      { id: 'fake_data', name: '虚假数据', cost: 2, cooldown: 0 },
      { id: 'misdirection', name: '误导系统', cost: 3, cooldown: 1 }
    ]
  },
  guerrilla: {
    name: '打游击',
    icon: '🎯',
    description: '动态防御、移动目标',
    color: '#faad14',
    category: 'advanced',
    tools: [
      { id: 'mtd', name: '移动目标防御', cost: 3, cooldown: 1 },
      { id: 'dynamic_config', name: '动态配置', cost: 2, cooldown: 0 },
      { id: 'adaptive_defense', name: '自适应防御', cost: 4, cooldown: 2 }
    ]
  },
  taichi: {
    name: '打太极',
    icon: '☯️',
    description: 'AI防御、智能对抗',
    color: '#531dab',
    category: 'advanced',
    tools: [
      { id: 'ai_defense', name: 'AI防御系统', cost: 4, cooldown: 2 },
      { id: 'ml_detection', name: '机器学习检测', cost: 3, cooldown: 1 },
      { id: 'auto_response', name: '自动响应', cost: 3, cooldown: 1 }
    ]
  }
};

interface Tool {
  id: string;
  name: string;
  cost: number;
  cooldown: number;
  available?: boolean;
  cooldownRemaining?: number;
}

interface DefenseToolboxProps {
  available: string[];
  selected: string | null;
  onSelect: (tool: string) => void;
  disabled?: boolean;
}

const DefenseToolbox: React.FC<DefenseToolboxProps> = ({
  available,
  selected,
  onSelect,
  disabled = false
}) => {
  const [tools, setTools] = useState<Record<string, Tool[]>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  // 初始化工具
  useEffect(() => {
    const allTools: Record<string, Tool[]> = {};
    
    Object.entries(EIGHT_STRIKES).forEach(([key, category]) => {
      allTools[key] = category.tools.map(tool => ({
        ...tool,
        available: available.includes(tool.id) || available.includes(key),
        cooldownRemaining: 0
      }));
    });
    
    setTools(allTools);
  }, [available]);

  // 选择工具
  const handleSelectTool = (categoryKey: string, toolId: string) => {
    if (disabled) {
      message.warning('当前不是你的回合');
      return;
    }

    const tool = tools[categoryKey]?.find(t => t.id === toolId);
    if (!tool) return;

    if (!tool.available) {
      message.warning('该工具暂不可用');
      return;
    }

    if (tool.cooldownRemaining && tool.cooldownRemaining > 0) {
      message.warning(`冷却中，还需等待 ${tool.cooldownRemaining} 回合`);
      return;
    }

    onSelect(toolId);
    message.success(`已选择: ${tool.name}`);
  };

  // 渲染防御类别
  const renderCategory = (key: string, category: any) => {
    const categoryTools = tools[key] || [];
    
    return (
      <Card
        key={key}
        size="small"
        className="defense-category"
        style={{ borderColor: category.color }}
        title={
          <div className="category-title">
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
            <Tag color={category.color} >{category.description}</Tag>
          </div>
        }
      >
        <Row gutter={[8, 8]}>
          {categoryTools.map(tool => (
            <Col span={8} key={tool.id}>
              <Tooltip
                title={
                  <div>
                    <div>消耗: {tool.cost} 行动点</div>
                    <div>冷却: {tool.cooldown} 回合</div>
                    {!tool.available && <div>需要解锁</div>}
                  </div>
                }
              >
                <Card
                  size="small"
                  className={`tool-card ${selected === tool.id ? 'selected' : ''} ${!tool.available ? 'disabled' : ''}`}
                  hoverable={tool.available && !disabled}
                  onClick={() => tool.available && handleSelectTool(key, tool.id)}
                >
                  <div className="tool-info">
                    <div className="tool-name">{tool.name}</div>
                    <Badge
                      count={tool.cooldownRemaining || 0}
                      size="small"
                      style={{ backgroundColor: '#f5222d' }}
                    >
                      <Tag color={category.color} >
                        {tool.cost} AP
                      </Tag>
                    </Badge>
                  </div>
                  {!tool.available && (
                    <div className="tool-lock-overlay">
                      <LockOutlined />
                    </div>
                  )}
                  {selected === tool.id && (
                    <div className="tool-selected-badge">
                      <CheckCircleOutlined />
                    </div>
                  )}
                </Card>
              </Tooltip>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  // 基础防御工具
  const basicDefenses = Object.entries(EIGHT_STRIKES)
    .filter(([_, category]) => category.category === 'basic');

  // 先进防御工具  
  const advancedDefenses = Object.entries(EIGHT_STRIKES)
    .filter(([_, category]) => category.category === 'advanced');

  return (
    <div className="defense-toolbox">
      <Card 
        title={
          <span>
            <SafetyOutlined /> 防御工具箱 - 八个打
          </span>
        }
        size="small"
      >
        {/* 分类标签 */}
        <div className="defense-tabs">
          <Tag
            color={activeTab === 'basic' ? 'blue' : 'default'}
            onClick={() => setActiveTab('basic')}
            style={{ cursor: 'pointer' }}
          >
            <SafetyOutlined /> 基础防御
          </Tag>
          <Tag
            color={activeTab === 'advanced' ? 'purple' : 'default'}
            onClick={() => setActiveTab('advanced')}
            style={{ cursor: 'pointer' }}
          >
            <RocketOutlined /> 先进防御
          </Tag>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* 工具列表 */}
        <div className="defense-tools-container">
          {activeTab === 'basic' ? (
            <Row gutter={[8, 8]}>
              {basicDefenses.map(([key, category]) => (
                <Col span={12} key={key}>
                  {renderCategory(key, category)}
                </Col>
              ))}
            </Row>
          ) : (
            <Row gutter={[8, 8]}>
              {advancedDefenses.map(([key, category]) => (
                <Col span={12} key={key}>
                  {renderCategory(key, category)}
                </Col>
              ))}
            </Row>
          )}
        </div>

        {/* 选中工具显示 */}
        {selected && (
          <div className="selected-tool-display">
            <Divider style={{ margin: '12px 0' }} />
            <Tag color="green" icon={<CheckCircleOutlined />}>
              当前选择: {
                Object.values(EIGHT_STRIKES).flatMap(c => c.tools)
                  .find(t => t.id === selected)?.name || selected
              }
            </Tag>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DefenseToolbox;