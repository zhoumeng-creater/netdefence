import React from 'react';
import { Card, Empty } from 'antd';

export const GameHistory: React.FC = () => {
  return (
    <Card title="对战记录">
      <Empty description="对战记录功能开发中..." />
    </Card>
  );
};