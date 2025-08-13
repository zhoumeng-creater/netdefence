import React from 'react';
import { Card, Empty } from 'antd';

export const CourseDetail: React.FC = () => {
  return (
    <Card title="课程详情">
      <Empty description="课程详情功能开发中..." />
    </Card>
  );
};

export default CourseDetail;