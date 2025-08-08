import React from 'react';
import { Card, Empty } from 'antd';

export const ChessList: React.FC = () => {
  return (
    <Card title="棋谱列表">
      <Empty description="棋谱列表功能开发中..." />
    </Card>
  );
};