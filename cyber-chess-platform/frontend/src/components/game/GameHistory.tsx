/**
 * 游戏历史记录组件
 * 显示游戏对战过程中的所有动作记录
 */
import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  Timeline, 
  Tag, 
  Empty, 
  Space, 
  Button, 
  Input,
  Tooltip,
  Badge,
  Divider,
  Typography,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  BugOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  ExperimentOutlined,
  DollarOutlined,
  MailOutlined,
  CloudOutlined,
  SwapOutlined,
  EyeOutlined,
  MedicineBoxOutlined,
  CompassOutlined,
  RocketOutlined,
  AlertOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;
const { Search } = Input;

// 游戏移动记录接口
interface GameMove {
  round: number;
  player: string;
  action: string;
  action_name: string;
  target: any;
  success: boolean;
  description: string;
  impact: any;
  timestamp: string;
}

// 组件属性接口
interface GameHistoryProps {
  moves: GameMove[];
  currentRound?: number;
  onMoveClick?: (move: GameMove, index: number) => void;
  showStatistics?: boolean;
  allowExport?: boolean;
}

// 动作图标映射
const ACTION_ICONS: Record<string, React.ReactNode> = {
  // 攻击动作（七宗罪）
  'prank': '😈',
  'exploit': '🔓',
  'theft': '🦹',
  'destroy': '💥',
  'ransom': '💰',
  'phish': '🎣',
  'chaos': '🌪️',
  
  // 防御动作（八个打）
  'patch': '🩹',
  'firewall': '🛡️',
  'monitor': '👁️',
  'vaccine': '💊',
  'ambush': '🍯',
  'decoy': '🎭',
  'guerrilla': '🎯',
  'taichi': '☯️',
  
  // 其他动作
  'sql_injection': <BugOutlined />,
  'xss': <AlertOutlined />,
  'ddos': <ThunderboltOutlined />,
  'waf': <SafetyOutlined />,
  'ids': <EyeOutlined />,
  'honeypot': <ExperimentOutlined />
};

// 动作类型颜色映射
const ACTION_COLORS: Record<string, string> = {
  // 攻击类
  'prank': 'purple',
  'exploit': 'red',
  'theft': 'orange',
  'destroy': 'volcano',
  'ransom': 'gold',
  'phish': 'blue',
  'chaos': 'magenta',
  
  // 防御类
  'patch': 'green',
  'firewall': 'cyan',
  'monitor': 'blue',
  'vaccine': 'lime',
  'ambush': 'purple',
  'decoy': 'orange',
  'guerrilla': 'gold',
  'taichi': 'geekblue'
};

const GameHistory: React.FC<GameHistoryProps> = ({ 
  moves, 
  currentRound = 0,
  onMoveClick,
  showStatistics = true,
  allowExport = true
}) => {
  const [filteredMoves, setFilteredMoves] = useState<GameMove[]>(moves);
  const [searchText, setSearchText] = useState('');
  const [filterPlayer, setFilterPlayer] = useState<'all' | 'attacker' | 'defender'>('all');
  const [filterSuccess, setFilterSuccess] = useState<'all' | 'success' | 'fail'>('all');
  const historyEndRef = useRef<HTMLDivElement>(null);

  // 更新过滤后的动作列表
  useEffect(() => {
    let filtered = [...moves];
    
    // 按搜索文本过滤
    if (searchText) {
      filtered = filtered.filter(move => 
        move.action_name.toLowerCase().includes(searchText.toLowerCase()) ||
        move.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // 按玩家过滤
    if (filterPlayer !== 'all') {
      filtered = filtered.filter(move => move.player === filterPlayer);
    }
    
    // 按成功状态过滤
    if (filterSuccess !== 'all') {
      filtered = filtered.filter(move => 
        filterSuccess === 'success' ? move.success : !move.success
      );
    }
    
    setFilteredMoves(filtered);
  }, [moves, searchText, filterPlayer, filterSuccess]);

  // 自动滚动到最新记录
  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [moves]);

  // 获取时间轴颜色
  const getTimelineColor = (move: GameMove) => {
    if (move.success) return 'green';
    if (!move.success) return 'red';
    return 'gray';
  };

  // 获取玩家颜色
  const getPlayerColor = (player: string) => {
    return player === 'attacker' ? 'red' : 'green';
  };

  // 获取动作图标
  const getActionIcon = (action: string) => {
    return ACTION_ICONS[action] || <FireOutlined />;
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // 计算统计数据
  const calculateStatistics = () => {
    const totalMoves = moves.length;
    const attackerMoves = moves.filter(m => m.player === 'attacker');
    const defenderMoves = moves.filter(m => m.player === 'defender');
    const successfulMoves = moves.filter(m => m.success);
    
    return {
      total: totalMoves,
      attackerCount: attackerMoves.length,
      defenderCount: defenderMoves.length,
      successRate: totalMoves > 0 ? 
        Math.round((successfulMoves.length / totalMoves) * 100) : 0,
      attackerSuccessRate: attackerMoves.length > 0 ?
        Math.round((attackerMoves.filter(m => m.success).length / attackerMoves.length) * 100) : 0,
      defenderSuccessRate: defenderMoves.length > 0 ?
        Math.round((defenderMoves.filter(m => m.success).length / defenderMoves.length) * 100) : 0
    };
  };

  // 导出历史记录
  const exportHistory = () => {
    const dataStr = JSON.stringify(moves, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `game_history_${new Date().getTime()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const stats = calculateStatistics();

  return (
    <Card 
      title={
        <Space>
          <ClockCircleOutlined />
          <span>游戏历史</span>
          <Badge count={moves.length} style={{ backgroundColor: '#52c41a' }} />
        </Space>
      }
      extra={
        <Space>
          {allowExport && (
            <Tooltip title="导出历史">
              <Button 
                icon={<DownloadOutlined />} 
                size="small"
                onClick={exportHistory}
              />
            </Tooltip>
          )}
        </Space>
      }
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* 搜索和过滤栏 */}
      <div style={{ marginBottom: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Search
            placeholder="搜索动作..."
            allowClear
            size="small"
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
          />
          
          <Space wrap>
            <Text type="secondary">过滤:</Text>
            <Tag 
              color={filterPlayer === 'all' ? 'blue' : 'default'}
              style={{ cursor: 'pointer' }}
              onClick={() => setFilterPlayer('all')}
            >
              全部
            </Tag>
            <Tag 
              color={filterPlayer === 'attacker' ? 'red' : 'default'}
              style={{ cursor: 'pointer' }}
              onClick={() => setFilterPlayer('attacker')}
              icon={<BugOutlined />}
            >
              攻击方
            </Tag>
            <Tag 
              color={filterPlayer === 'defender' ? 'green' : 'default'}
              style={{ cursor: 'pointer' }}
              onClick={() => setFilterPlayer('defender')}
              icon={<SafetyOutlined />}
            >
              防御方
            </Tag>
            <Divider type="vertical" />
            <Tag 
              color={filterSuccess === 'all' ? 'blue' : 'default'}
              style={{ cursor: 'pointer' }}
              onClick={() => setFilterSuccess('all')}
            >
              全部结果
            </Tag>
            <Tag 
              color={filterSuccess === 'success' ? 'green' : 'default'}
              style={{ cursor: 'pointer' }}
              onClick={() => setFilterSuccess('success')}
              icon={<CheckCircleOutlined />}
            >
              成功
            </Tag>
            <Tag 
              color={filterSuccess === 'fail' ? 'red' : 'default'}
              style={{ cursor: 'pointer' }}
              onClick={() => setFilterSuccess('fail')}
              icon={<CloseCircleOutlined />}
            >
              失败
            </Tag>
          </Space>
        </Space>
      </div>

      {/* 统计信息 */}
      {showStatistics && moves.length > 0 && (
        <Card size="small" style={{ marginBottom: '16px', background: '#fafafa' }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic 
                title="总动作数" 
                value={stats.total} 
                prefix={<SwapOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="总成功率" 
                value={stats.successRate} 
                suffix="%" 
                valueStyle={{ color: stats.successRate > 50 ? '#3f8600' : '#cf1322' }}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="当前回合" 
                value={currentRound} 
                prefix={<ClockCircleOutlined />}
              />
            </Col>
          </Row>
          <Divider style={{ margin: '12px 0' }} />
          <Row gutter={16}>
            <Col span={12}>
              <Space>
                <BugOutlined style={{ color: '#ff4d4f' }} />
                <Text>攻击: {stats.attackerCount} 次</Text>
                <Text type="secondary">({stats.attackerSuccessRate}% 成功)</Text>
              </Space>
            </Col>
            <Col span={12}>
              <Space>
                <SafetyOutlined style={{ color: '#52c41a' }} />
                <Text>防御: {stats.defenderCount} 次</Text>
                <Text type="secondary">({stats.defenderSuccessRate}% 成功)</Text>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* 历史记录时间轴 */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {filteredMoves.length === 0 ? (
          <Empty 
            description={searchText || filterPlayer !== 'all' || filterSuccess !== 'all' ? 
              "没有匹配的记录" : "暂无游戏记录"
            } 
          />
        ) : (
          <Timeline mode="left">
            {filteredMoves.map((move, index) => (
              <Timeline.Item
                key={index}
                color={getTimelineColor(move)}
                dot={move.success ? 
                  <CheckCircleOutlined style={{ fontSize: '16px' }} /> : 
                  <CloseCircleOutlined style={{ fontSize: '16px' }} />
                }
              >
                <Card 
                  size="small" 
                  hoverable={!!onMoveClick}
                  onClick={() => onMoveClick && onMoveClick(move, index)}
                  style={{ 
                    cursor: onMoveClick ? 'pointer' : 'default',
                    borderLeft: `3px solid ${move.player === 'attacker' ? '#ff4d4f' : '#52c41a'}`
                  }}
                >
                  {/* 回合和玩家信息 */}
                  <div style={{ marginBottom: '8px' }}>
                    <Space>
                      <Tag color="blue" >第{move.round}回合</Tag>
                      <Tag 
                        color={getPlayerColor(move.player)} 
                        icon={move.player === 'attacker' ? <BugOutlined /> : <SafetyOutlined />}
                      >
                        {move.player === 'attacker' ? '攻击方' : '防御方'}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {formatTime(move.timestamp)}
                      </Text>
                    </Space>
                  </div>
                  
                  {/* 动作信息 */}
                  <div style={{ marginBottom: '8px' }}>
                    <Space align="center">
                      <span style={{ fontSize: '18px' }}>
                        {getActionIcon(move.action)}
                      </span>
                      <Text strong>{move.action_name}</Text>
                      {move.target && (
                        <>
                          <SwapOutlined />
                          <Tag color="orange">
                            {move.target.name || move.target.id || '目标'}
                          </Tag>
                        </>
                      )}
                    </Space>
                  </div>
                  
                  {/* 结果描述 */}
                  <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>
                    {move.description}
                  </div>
                  
                  {/* 影响分数 */}
                  {move.impact && Object.keys(move.impact).length > 0 && (
                    <div>
                      <Space wrap size={4}>
                        {Object.entries(move.impact).map(([key, value]: [string, any]) => {
                          const impactValue = Number(value);
                          const isPositive = impactValue > 0;
                          const impactIcon = key === 'trust' ? <SafetyOutlined /> :
                                           key === 'risk' ? <AlertOutlined /> :
                                           key === 'incident' ? <BugOutlined /> :
                                           key === 'loss' ? <DollarOutlined /> : null;
                          
                          return (
                            <Tag 
                              key={key} 
                              color={isPositive ? 'green' : 'red'}
                              icon={impactIcon}
                            >
                              {key}: {isPositive ? '+' : ''}{impactValue}
                            </Tag>
                          );
                        })}
                      </Space>
                    </div>
                  )}
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
        <div ref={historyEndRef} />
      </div>
    </Card>
  );
};

export default GameHistory;