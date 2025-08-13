import React from 'react';
import { Card, Empty } from 'antd';

export const EventCreate: React.FC = () => {
  return (
    <Card title="创建事件">
      <Empty description="创建事件功能开发中..." />
    </Card>
  );
};

export default EventCreate;