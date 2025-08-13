import React from 'react';
import { Card, Empty } from 'antd';

export const ChessDetail: React.FC = () => {
  return (
    <Card title="棋谱详情">
      <Empty description="棋谱详情功能开发中..." />
    </Card>
  );
};

export default ChessDetail;