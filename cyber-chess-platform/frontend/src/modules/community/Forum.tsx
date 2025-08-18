import React from 'react';
import { Card, Result, Button } from 'antd';
import { MessageOutlined } from '@ant-design/icons';

export const Forum: React.FC = () => {
  return (
    <Card>
      <Result
        icon={<MessageOutlined style={{ fontSize: 72, color: '#00d4ff' }} />}
        title="论坛功能开发中"
        subTitle="论坛功能正在规划开发中，敬请期待"
        extra={[
          <Button type="primary" key="back" onClick={() => window.history.back()}>
            返回
          </Button>
        ]}
      />
    </Card>
  );
};

export default Forum;