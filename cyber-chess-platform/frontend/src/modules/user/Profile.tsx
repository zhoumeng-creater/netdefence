import React from 'react';
import { Card, Empty } from 'antd';

export const Profile: React.FC = () => {
  return (
    <Card title="个人资料">
      <Empty description="个人资料功能开发中..." />
    </Card>
  );
};