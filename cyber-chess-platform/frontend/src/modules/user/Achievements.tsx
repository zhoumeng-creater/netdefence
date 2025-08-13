import React from 'react';
import { Card, Empty } from 'antd';

export const Achievements: React.FC = () => {
  return (
    <Card title="成就">
      <Empty description="成就功能开发中..." />
    </Card>
  );
};

export default Achievements;