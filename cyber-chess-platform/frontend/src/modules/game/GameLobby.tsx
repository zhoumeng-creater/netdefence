// src/modules/game/GameLobby.tsx
import React from 'react';
import { Card, Empty } from 'antd';

export const GameLobby: React.FC = () => {
  return (
    <Card title="游戏大厅">
      <Empty description="游戏大厅功能开发中..." />
    </Card>
  );
};

export default GameLobby;