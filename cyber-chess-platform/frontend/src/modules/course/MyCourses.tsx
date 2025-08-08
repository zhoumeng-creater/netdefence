import React from 'react';
import { Card, Empty } from 'antd';

export const MyCourses: React.FC = () => {
  return (
    <Card title="我的课程">
      <Empty description="我的课程功能开发中..." />
    </Card>
  );
};