import React, { useEffect, useState } from 'react';
import { Card, Table, Avatar, Tag, Select, Space, Empty, Spin } from 'antd';
import { TrophyOutlined, CrownOutlined } from '@ant-design/icons';

export const Leaderboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('all');
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/game/leaderboard?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data || []);
      }
    } catch (error) {
      console.error('获取排行榜失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => {
        if (rank === 1) return <Tag color="gold"><CrownOutlined /> 冠军</Tag>;
        if (rank === 2) return <Tag color="silver"><TrophyOutlined /> 亚军</Tag>;
        if (rank === 3) return <Tag color="#cd7f32"><TrophyOutlined /> 季军</Tag>;
        return <Tag>{rank}</Tag>;
      },
    },
    {
      title: '玩家',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => (
        <Space>
          <Avatar style={{ backgroundColor: '#00d4ff' }}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <span>{user?.username || '未知玩家'}</span>
        </Space>
      ),
    },
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      render: (score: number) => <strong>{score || 0}</strong>,
    },
    {
      title: '场次',
      dataIndex: 'gamesPlayed',
      key: 'gamesPlayed',
    },
  ];

  return (
    <Card 
      title="排行榜"
      extra={
        <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
          <Select.Option value="all">总榜</Select.Option>
          <Select.Option value="monthly">月榜</Select.Option>
          <Select.Option value="weekly">周榜</Select.Option>
          <Select.Option value="daily">日榜</Select.Option>
        </Select>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : data.length === 0 ? (
        <Empty description="暂无排行数据" />
      ) : (
        <Table
          columns={columns}
          dataSource={data}
          pagination={false}
          rowKey="rank"
        />
      )}
    </Card>
  );
};

export default Leaderboard;