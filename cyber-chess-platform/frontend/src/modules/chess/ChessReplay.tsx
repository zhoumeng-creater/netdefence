// src/modules/chess/ChessReplay.tsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Slider, Space, Timeline, List } from 'antd';
import { PlayCircleOutlined, PauseOutlined, StepBackwardOutlined, StepForwardOutlined, ReloadOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { ChessMove } from '@/types';

const ReplayContainer = styled.div`
  padding: 20px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3));
  border-radius: 12px;
`;

const ControlPanel = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-top: 20px;
`;

interface ChessReplayProps {
  chessId: string;
}

export const ChessReplay: React.FC<ChessReplayProps> = ({ chessId }) => {
  const [playing, setPlaying] = useState(false);
  const [currentMove, setCurrentMove] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [moves, setMoves] = useState<ChessMove[]>([]);

  useEffect(() => {
    // TODO: 加载棋谱数据
    console.log('Loading chess record:', chessId);
  }, [chessId]);

  const handlePlay = () => {
    setPlaying(!playing);
  };

  const handlePrevious = () => {
    setCurrentMove(Math.max(0, currentMove - 1));
  };

  const handleNext = () => {
    setCurrentMove(Math.min(moves.length - 1, currentMove + 1));
  };

  const handleReset = () => {
    setCurrentMove(0);
    setPlaying(false);
  };

  return (
    <ReplayContainer>
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card title="🎮 棋谱回放" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <h2 style={{ color: '#00d4ff' }}>游戏画面回放区域</h2>
            </div>
            
            <ControlPanel>
              <Button icon={<StepBackwardOutlined />} onClick={handlePrevious} />
              <Button 
                type="primary" 
                icon={playing ? <PauseOutlined /> : <PlayCircleOutlined />}
                onClick={handlePlay}
              >
                {playing ? '暂停' : '播放'}
              </Button>
              <Button icon={<StepForwardOutlined />} onClick={handleNext} />
              <Button icon={<ReloadOutlined />} onClick={handleReset} />
              
              <div style={{ flex: 1, marginLeft: 20 }}>
                <div style={{ marginBottom: 8, color: 'rgba(255,255,255,0.65)' }}>
                  进度: {currentMove + 1} / {moves.length || 1}
                </div>
                <Slider 
                  value={currentMove} 
                  max={moves.length - 1 || 0}
                  onChange={setCurrentMove}
                />
              </div>
              
              <div>
                <div style={{ marginBottom: 8, color: 'rgba(255,255,255,0.65)' }}>
                  速度: {speed}x
                </div>
                <Slider 
                  value={speed} 
                  min={0.5} 
                  max={3} 
                  step={0.5}
                  onChange={setSpeed}
                  style={{ width: 100 }}
                />
              </div>
            </ControlPanel>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="📜 行动记录" style={{ background: 'rgba(255, 255, 255, 0.02)', height: '100%' }}>
            <Timeline mode="left">
              {[1, 2, 3, 4, 5].map(i => (
                <Timeline.Item 
                  key={i}
                  color={i <= currentMove + 1 ? 'blue' : 'gray'}
                >
                  <div style={{ opacity: i <= currentMove + 1 ? 1 : 0.5 }}>
                    <strong>回合 {i}</strong>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                      攻击方执行了APT侦察
                    </p>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>
    </ReplayContainer>
  );
};

export default ChessReplay;