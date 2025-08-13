import React from 'react';
import { Card, Empty } from 'antd';

export const EventLibrary: React.FC = () => {
  return (
    <Card title="安全事件库">
      <Empty description="安全事件库功能开发中..." />
    </Card>
  );
};

export default EventLibrary;