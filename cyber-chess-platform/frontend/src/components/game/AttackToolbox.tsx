/**
 * 攻击工具箱组件
 * 基于"七宗罪"的攻击工具选择界面
 */
import React, { useState, useEffect } from 'react';
import { Card, Tooltip, Badge, Row, Col, Tag, Progress, Spin, message } from 'antd';
import {
  BugOutlined,
  UnlockOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  MailOutlined,
  CloudOutlined,
  FireOutlined,
  LockOutlined
} from '@ant-design/icons';
import './AttackToolbox.css';

// 七宗罪攻击方法定义
const SEVEN_SINS = {
  prank: {
    name: '恶作剧',
    icon: '😈',
    description: '病毒投放、系统破坏',
    color: '#722ed1',
    tools: [
      { id: 'virus', name: 'CIH病毒', cost: 2, cooldown: 0 },
      { id: 'trojan', name: '木马程序', cost: 2, cooldown: 0 },
      { id: 'worm', name: '蠕虫病毒', cost: 3, cooldown: 1 }
    ]
  },
  exploit: {
    name: '钻空子',
    icon: '🔓',
    description: '漏洞利用、0day攻击',
    color: '#13c2c2',
    tools: [
      { id: 'sql_injection', name: 'SQL注入', cost: 3, cooldown: 1 },
      { id: 'xss', name: 'XSS攻击', cost: 2, cooldown: 0 },
      { id: 'buffer_overflow', name: '缓冲区溢出', cost: 4, cooldown: 2 }
    ]
  },
  theft: {
    name: '偷东西',
    icon: '🦹',
    description: '数据窃取、撞库攻击',
    color: '#fa541c',
    tools: [
      { id: 'data_breach', name: '数据窃取', cost: 2, cooldown: 0 },
      { id: 'credential_stuffing', name: '撞库攻击', cost: 2, cooldown: 0 },
      { id: 'dns_hijack', name: 'DNS劫持', cost: 3, cooldown: 1 }
    ]
  },
  destroy: {
    name: '搞破坏',
    icon: '💥',
    description: 'DDoS、破坏性攻击',
    color: '#f5222d',
    tools: [
      { id: 'ddos', name: 'DDoS攻击', cost: 4, cooldown: 2 },
      { id: 'defacement', name: '网页篡改', cost: 2, cooldown: 0 },
      { id: 'data_wipe', name: '数据销毁', cost: 5, cooldown: 3 }
    ]
  },
  ransom: {
    name: '整绑架',
    icon: '💰',
    description: '勒索软件、文件加密',
    color: '#faad14',
    tools: [
      { id: 'ransomware', name: '勒索软件', cost: 3, cooldown: 1 },
      { id: 'crypto_locker', name: '加密锁定', cost: 3, cooldown: 1 },
      { id: 'data_hostage', name: '数据人质', cost: 4, cooldown: 2 }
    ]
  },
  phish: {
    name: '钓鱼虾',
    icon: '🎣',
    description: '钓鱼攻击、社会工程',
    color: '#1890ff',
    tools: [
      { id: 'phishing_email', name: '钓鱼邮件', cost: 2, cooldown: 0 },
      { id: 'spear_phishing', name: '鱼叉攻击', cost: 3, cooldown: 1 },
      { id: 'watering_hole', name: '水坑攻击', cost: 4, cooldown: 2 }
    ]
  },
  chaos: {
    name: '搅浑水',
    icon: '🌪️',
    description: '供应链攻击、APT',
    color: '#531dab',
    tools: [
      { id: 'supply_chain', name: '供应链攻击', cost: 3, cooldown: 1 },
      { id: 'apt', name: 'APT攻击', cost: 5, cooldown: 3 },
      { id: 'zero_day', name: '0day利用', cost: 4, cooldown: 2 }
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

interface AttackToolboxProps {
  available: string[];
  selected: string | null;
  onSelect: (tool: string) => void;
  disabled?: boolean;
}

const AttackToolbox: React.FC<AttackToolboxProps> = ({
  available,
  selected,
  onSelect,
  disabled = false
}) => {
  const [tools, setTools] = useState<Record<string, Tool[]>>({});
  const [loading, setLoading] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // 初始化工具
  useEffect(() => {
    const allTools: Record<string, Tool[]> = {};
    
    Object.entries(SEVEN_SINS).forEach(([key, category]) => {
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

  // 获取分类样式
  const getCategoryStyle = (key: string) => {
    const category = SEVEN_SINS[key as keyof typeof SEVEN_SINS];
    return {
      borderColor: category.color,
      backgroundColor: expandedCategory === key ? `${category.color}10` : 'transparent'
    };
  };

  return (
    <div className="attack-toolbox">
      <Card 
        title={
          <span>
            <BugOutlined /> 攻击工具箱 - 七宗罪
          </span>
        }
        size="small"
      >
        <Spin spinning={loading}>
          <Row gutter={[8, 8]}>
            {Object.entries(SEVEN_SINS).map(([key, category]) => (
              <Col span={12} key={key}>
                <Card
                  size="small"
                  className={`attack-category ${expandedCategory === key ? 'expanded' : ''}`}
                  style={getCategoryStyle(key)}
                  hoverable
                  onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
                >
                  <div className="category-header">
                    <span className="category-icon">{category.icon}</span>
                    <div className="category-info">
                      <div className="category-name">{category.name}</div>
                      <div className="category-desc">{category.description}</div>
                    </div>
                  </div>
                  
                  {expandedCategory === key && (
                    <div className="category-tools">
                      {tools[key]?.map(tool => (
                        <Tooltip
                          key={tool.id}
                          title={
                            <div>
                              <div>消耗: {tool.cost} 行动点</div>
                              <div>冷却: {tool.cooldown} 回合</div>
                              {!tool.available && <div>需要解锁</div>}
                            </div>
                          }
                        >
                          <div
                            className={`tool-item ${selected === tool.id ? 'selected' : ''} ${!tool.available ? 'disabled' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectTool(key, tool.id);
                            }}
                          >
                            <Badge 
                              count={tool.cooldownRemaining || 0} 
                              size="small"
                              style={{ backgroundColor: '#f5222d' }}
                            >
                              <div className="tool-content">
                                <div className="tool-name">{tool.name}</div>
                                <div className="tool-cost">
                                  <Tag color={category.color} >
                                    {tool.cost} AP
                                  </Tag>
                                </div>
                              </div>
                            </Badge>
                            {!tool.available && (
                              <div className="tool-lock">
                                <LockOutlined />
                              </div>
                            )}
                          </div>
                        </Tooltip>
                      ))}
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        </Spin>
        
        {/* 选中工具显示 */}
        {selected && (
          <div className="selected-tool-display">
            <Tag color="red" icon={<FireOutlined />}>
              当前选择: {
                Object.values(SEVEN_SINS).flatMap(c => c.tools)
                  .find(t => t.id === selected)?.name || selected
              }
            </Tag>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AttackToolbox;