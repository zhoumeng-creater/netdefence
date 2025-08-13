import React from 'react';
import { Card, Empty } from 'antd';

export const CourseCreate: React.FC = () => {
  return (
    <Card title="创建课程">
      <Empty description="创建课程功能开发中..." />
    </Card>
  );
};

export default CourseCreate;