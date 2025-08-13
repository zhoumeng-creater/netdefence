// src/modules/game/GamePlay.tsx
import React from 'react';
import { Card, Empty } from 'antd';

export const GamePlay: React.FC = () => {
  return (
    <Card title="游戏对战">
      <Empty description="游戏对战功能开发中..." />
    </Card>
  );
};

export default GamePlay;