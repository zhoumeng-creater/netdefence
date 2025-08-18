import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Avatar, Descriptions, Button, Statistic, message, Empty, Spin } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '@/store';

export const Profile: React.FC = () => {
  const { id } = useParams();
  const currentUser = useAppSelector(state => state.auth.user);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 如果是查看自己的资料，直接使用store中的用户信息
    if (!id || id === currentUser?.id) {
      setUser(currentUser);
      setLoading(false);
    } else {
      // 查看其他用户资料
      fetchUserProfile(id);
    }
  }, [id, currentUser]);

  const fetchUserProfile = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setUser(result.data);
      } else {
        message.error('获取用户信息失败');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      message.error('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const isOwnProfile = !id || id === currentUser?.id;

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <Empty description="用户不存在" />
      </Card>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <Avatar size={128} icon={<UserOutlined />} style={{ backgroundColor: '#00d4ff' }} />
            <h2 style={{ marginTop: 16 }}>{user.username || '未知用户'}</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.65)' }}>{user.email}</p>
            {isOwnProfile && (
              <Button icon={<EditOutlined />} style={{ marginTop: 16 }}>
                编辑资料
              </Button>
            )}
          </div>
        </Card>
      </Col>
      
      <Col xs={24} md={16}>
        <Card title="基本信息">
          <Descriptions column={2}>
            <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
            <Descriptions.Item label="角色">{user.role}</Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '未知'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
        
        <Card title="游戏统计" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="总场次" value={0} />
            </Col>
            <Col span={6}>
              <Statistic title="胜场" value={0} />
            </Col>
            <Col span={6}>
              <Statistic title="总分" value={0} />
            </Col>
            <Col span={6}>
              <Statistic title="胜率" value={0} suffix="%" />
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
};

export default Profile;