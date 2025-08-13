import React from 'react';
import { Card, Empty } from 'antd';

export const Statistics: React.FC = () => {
  return (
    <Card title="数据统计">
      <Empty description="数据统计功能开发中..." />
    </Card>
  );
};

export default Statistics;