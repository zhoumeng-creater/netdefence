// src/modules/game/TacticsPanel.tsx
import React, { useState } from 'react';
import { Card, Row, Col, Button, Tooltip, Tag, message } from 'antd';
import { ThunderboltOutlined, FireOutlined, ShieldOutlined, SearchOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { GameTactic, GameResource } from '@/types';

const PanelContainer = styled.div`
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
`;

const TacticCard = styled(Card)`
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
  
  &:hover:not(.disabled) {
    border-color: #00d4ff;
    background: rgba(0, 212, 255, 0.1);
    transform: scale(1.02);
  }
  
  &.selected {
    border-color: #00d4ff;
    background: rgba(0, 212, 255, 0.2);
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
  }
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResourceBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 8px;
`;

interface TacticsPanelProps {
  tactics: GameTactic[];
  resources: Record<string, GameResource>;
  selectedTactic: GameTactic | null;
  onSelectTactic: (tactic: GameTactic) => void;
  onExecute: () => void;
}

export const TacticsPanel: React.FC<TacticsPanelProps> = ({
  tactics,
  resources,
  selectedTactic,
  onSelectTactic,
  onExecute,
}) => {
  const checkCanAfford = (tactic: GameTactic): boolean => {
    return Object.entries(tactic.cost).every(([key, value]) => {
      return resources[key]?.value >= value;
    });
  };

  const formatCost = (cost: Record<string, number>): string => {
    return Object.entries(cost)
      .map(([key, value]) => `${value} ${key}`)
      .join(', ');
  };

  return (
    <PanelContainer>
      <h3 style={{ color: '#00d4ff', marginBottom: 20 }}>⚡ 选择战术</h3>
      
      {/* 资源显示 */}
      <Row gutter={[8, 8]} style={{ marginBottom: 20 }}>
        {Object.entries(resources).map(([key, resource]) => (
          <Col span={8} key={key}>
            <ResourceBar>
              <span>{resource.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{resource.name}</div>
                <div style={{ fontWeight: 'bold', color: '#00d4ff' }}>
                  {resource.value}/{resource.max}
                </div>
              </div>
            </ResourceBar>
          </Col>
        ))}
      </Row>

      {/* 战术卡片 */}
      <Row gutter={[16, 16]}>
        {tactics.map((tactic) => {
          const canAfford = checkCanAfford(tactic);
          const isSelected = selectedTactic?.id === tactic.id;
          
          return (
            <Col xs={24} sm={12} md={8} key={tactic.id}>
              <TacticCard
                className={`${!canAfford ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => canAfford && onSelectTactic(tactic)}
              >
                <div style={{ textAlign: 'center' }}>
                  <ThunderboltOutlined style={{ fontSize: 32, color: canAfford ? '#00d4ff' : '#666' }} />
                  <h4 style={{ color: canAfford ? '#00d4ff' : '#666', margin: '8px 0' }}>
                    {tactic.name}
                  </h4>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>
                    {tactic.description}
                  </p>
                  <Tag color="orange">{formatCost(tactic.cost)}</Tag>
                  {tactic.cooldown && (
                    <Tag color="blue" style={{ marginTop: 8 }}>冷却: {tactic.cooldown}回合</Tag>
                  )}
                </div>
              </TacticCard>
            </Col>
          );
        })}
      </Row>

      {/* 执行按钮 */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Button
          type="primary"
          size="large"
          icon={<FireOutlined />}
          onClick={onExecute}
          disabled={!selectedTactic}
          style={{
            background: selectedTactic ? 'linear-gradient(90deg, #00ff88, #00d4ff)' : '#444',
            border: 'none',
            height: 50,
            paddingLeft: 40,
            paddingRight: 40,
          }}
        >
          执行战术
        </Button>
      </div>
    </PanelContainer>
  );
};

export default TacticsPanel;