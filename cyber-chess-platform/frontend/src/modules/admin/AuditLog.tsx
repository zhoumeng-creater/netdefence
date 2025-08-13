import React from 'react';
import { Card, Empty } from 'antd';

export const AuditLog: React.FC = () => {
  return (
    <Card title="审计日志">
      <Empty description="审计日志功能开发中..." />
    </Card>
  );
};

export default AuditLog;