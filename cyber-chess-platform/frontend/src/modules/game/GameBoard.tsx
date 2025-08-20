// src/modules/game/GameBoard.tsx
import React from 'react';
import { Card, Row, Col, Progress, Badge } from 'antd';
import { SafetyOutlined, CloudOutlined, AppstoreOutlined, DatabaseOutlined, TeamOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { GameLayer } from '@/types';

const BoardContainer = styled.div`
  padding: 20px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(255, 0, 128, 0.02));
  border-radius: 12px;
  border: 1px solid rgba(0, 212, 255, 0.2);
`;

const LayerCard = styled(Card)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.1);
  margin-bottom: 16px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(5px);
    border-color: #00d4ff;
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.2);
  }
`;

const LayerIcon = styled.div`
  font-size: 32px;
  margin-bottom: 8px;
`;

interface GameBoardProps {
  state?: any;  // 游戏状态
  layers: Record<string, GameLayer>;
  onLayerClick?: (layerId: string) => void;
  infrastructure?: any[];
  vulnerabilities?: any[];
  onTargetSelect?: (target: string) => void;
  readonly?: boolean;  // 是否只读模式
  currentRound?: number;  // 当前回合
}

export const GameBoard: React.FC<GameBoardProps> = ({ 
  state,
  layers,
  infrastructure,
  vulnerabilities,
  onLayerClick,
  onTargetSelect,
  readonly = false,
  currentRound
}) => {
  const displayLayers = layers || state?.layers || {};
  const displayInfrastructure = infrastructure || state?.infrastructure || [];
  const displayVulnerabilities = vulnerabilities || state?.vulnerabilities || [];
  
  const layerIcons: Record<string, React.ReactNode> = {
    network: <CloudOutlined style={{ color: '#00d4ff' }} />,
    application: <AppstoreOutlined style={{ color: '#ff0080' }} />,
    data: <DatabaseOutlined style={{ color: '#00ff88' }} />,
    physical: <SafetyOutlined style={{ color: '#ffd700' }} />,
    personnel: <TeamOutlined style={{ color: '#ff00ff' }} />,
  };

  const getHealthColor = (health: number, maxHealth: number) => {
    const ratio = health / maxHealth;
    if (ratio > 0.6) return '#00ff88';
    if (ratio > 0.3) return '#ffd700';
    return '#ff0080';
  };

  return (
    <BoardContainer>
      <h3 style={{ color: '#00d4ff', marginBottom: 20 }}>🛡️ 系统防护状态</h3>
      <Row gutter={[16, 16]}>
        {Object.entries(layers).map(([id, layer]) => (
          <Col xs={24} sm={12} md={8} key={id}>
            <LayerCard
              hoverable
              onClick={() => onLayerClick?.(id)}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {layerIcons[id]}
                  <span>{layer.name}</span>
                </div>
              }
              extra={
                <Badge 
                  status={layer.status === 'critical' ? 'error' : layer.status === 'warning' ? 'warning' : 'success'} 
                />
              }
            >
              <div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: 'rgba(255,255,255,0.65)' }}>健康值：</span>
                  <span style={{ color: getHealthColor(layer.health, layer.maxHealth), fontWeight: 'bold' }}>
                    {layer.health}/{layer.maxHealth}
                  </span>
                </div>
                <Progress 
                  percent={(layer.health / layer.maxHealth) * 100} 
                  strokeColor={getHealthColor(layer.health, layer.maxHealth)}
                  showInfo={false}
                />
                <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                  防御力: {layer.defense}
                </div>
              </div>
            </LayerCard>
          </Col>
        ))}
      </Row>
    </BoardContainer>
  );
};

export default GameBoard;