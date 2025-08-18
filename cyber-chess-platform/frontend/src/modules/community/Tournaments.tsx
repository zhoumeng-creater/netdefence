import React from 'react';
import { Card, Result, Button } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';

export const Tournaments: React.FC = () => {
  return (
    <Card>
      <Result
        icon={<TrophyOutlined style={{ fontSize: 72, color: '#ffd700' }} />}
        title="竞赛功能开发中"
        subTitle="竞赛系统正在开发中，即将上线"
        extra={[
          <Button type="primary" key="back" onClick={() => window.history.back()}>
            返回
          </Button>
        ]}
      />
    </Card>
  );
};

export default Tournaments;