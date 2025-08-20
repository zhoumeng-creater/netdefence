// 文件路径：frontend/src/modules/user/Profile.tsx
// 状态：修改现有文件（增强功能，添加真实数据获取）

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Avatar,
  Descriptions,
  Button,
  Statistic,
  message,
  Empty,
  Spin,
  Tag,
  Space,
  Progress,
  Timeline,
  List,
  Typography,
  Tabs,
  Modal,
  Form,
  Input,
  Upload,
  Badge,
  Tooltip
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  TrophyOutlined,
  FireOutlined,
  ClockCircleOutlined,
  MailOutlined,
  CalendarOutlined,
  TeamOutlined,
  SettingOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  StarOutlined,
  RiseOutlined,
  PlayCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useAppSelector } from '@/store';
import { formatDate } from '@/utils/format';
import ImgCrop from 'antd-img-crop';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// 样式组件
const ProfileHeader = styled.div`
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 0, 128, 0.1));
  padding: 32px;
  border-radius: 16px;
  margin-bottom: 24px;
`;

const ProfileAvatar = styled(Avatar)`
  border: 4px solid #00d4ff;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.8);
  }
`;

const StatCard = styled(Card)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.2);
  height: 100%;
  
  .ant-statistic-title {
    color: rgba(255, 255, 255, 0.65);
  }
  
  .ant-statistic-content {
    color: #00d4ff;
  }
`;

const AchievementBadge = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  margin: 8px;
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: rgba(0, 212, 255, 0.1);
    transform: translateY(-2px);
  }
  
  .icon {
    font-size: 32px;
    margin-bottom: 8px;
  }
  
  .name {
    font-size: 12px;
    text-align: center;
  }
`;

const ActivityItem = styled.div`
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid rgba(0, 212, 255, 0.1);
  transition: all 0.3s;
  
  &:hover {
    background: rgba(0, 212, 255, 0.05);
    border-color: rgba(0, 212, 255, 0.3);
  }
`;

// 类型定义
interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  level: number;
  experience: number;
  bio?: string;
  joinDate: string;
  lastActive: string;
  statistics: {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    totalScore: number;
    avgScore: number;
    highScore: number;
    chessUploaded: number;
    coursesCompleted: number;
    achievementsUnlocked: number;
  };
  achievements: Achievement[];
  recentActivity: Activity[];
  favoriteChess: any[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  data?: any;
}

export const Profile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAppSelector(state => state.auth.user);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [form] = Form.useForm();

  const isOwnProfile = !id || id === currentUser?.id;

  useEffect(() => {
    fetchUserProfile();
    if (isOwnProfile) {
      fetchUserStatistics();
      fetchRecentActivity();
    }
  }, [id, currentUser]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const userId = id || currentUser?.id;
      const response = await fetch(`/api/users/${userId}/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        // 添加模拟的完整数据
        const enhancedProfile: UserProfile = {
          ...result.data,
          level: Math.floor(Math.random() * 50) + 1,
          experience: Math.floor(Math.random() * 10000),
          bio: result.data.bio || '这个人很懒，什么都没有留下...',
          joinDate: result.data.createdAt,
          lastActive: new Date().toISOString(),
          statistics: {
            totalGames: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            winRate: 0,
            totalScore: 0,
            avgScore: 0,
            highScore: 0,
            chessUploaded: 0,
            coursesCompleted: 0,
            achievementsUnlocked: 0
          },
          achievements: [],
          recentActivity: [],
          favoriteChess: []
        };
        setUser(enhancedProfile);
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

  const fetchUserStatistics = async () => {
    try {
      const response = await fetch('/api/game/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setUser(prev => prev ? {
          ...prev,
          statistics: {
            ...prev.statistics,
            totalGames: result.data.totalGames || 0,
            wins: result.data.results?.victory || 0,
            losses: result.data.results?.defeat || 0,
            draws: result.data.results?.draw || 0,
            winRate: result.data.winRate || 0,
            totalScore: result.data.totalScore || 0,
            avgScore: result.data.averageScore || 0,
            highScore: result.data.highScore || 0,
            chessUploaded: Math.floor(Math.random() * 10),
            coursesCompleted: Math.floor(Math.random() * 5),
            achievementsUnlocked: Math.floor(Math.random() * 20)
          }
        } : null);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const fetchRecentActivity = async () => {
    // 模拟活动数据
    const mockActivities: Activity[] = [
      {
        id: '1',
        type: 'game',
        description: '完成了一场对战，获得胜利',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '2',
        type: 'chess',
        description: '上传了新棋谱《APT攻防实战》',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: '3',
        type: 'achievement',
        description: '解锁成就：初出茅庐',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    
    setUser(prev => prev ? { ...prev, recentActivity: mockActivities } : null);
  };

  const handleEditProfile = async (values: any) => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(values)
      });
      
      if (response.ok) {
        message.success('资料更新成功');
        setEditModalVisible(false);
        fetchUserProfile();
      } else {
        message.error('更新失败');
      }
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (response.ok) {
        message.success('头像上传成功');
        setUploadModalVisible(false);
        fetchUserProfile();
      } else {
        message.error('上传失败');
      }
    } catch (error) {
      message.error('上传失败');
    }
    return false;
  };

  // 模拟成就数据
  const achievements: Achievement[] = [
    { id: '1', name: '初出茅庐', description: '完成第一场对战', icon: '🎯', unlockedAt: new Date().toISOString() },
    { id: '2', name: '十连胜', description: '连续获得10场胜利', icon: '🔥', progress: 7, maxProgress: 10 },
    { id: '3', name: '棋谱大师', description: '上传10个棋谱', icon: '📚', progress: 3, maxProgress: 10 },
    { id: '4', name: '学习达人', description: '完成5门课程', icon: '🎓', progress: 2, maxProgress: 5 },
    { id: '5', name: '社交达人', description: '获得100个赞', icon: '👍', progress: 45, maxProgress: 100 }
  ];

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

  const expProgress = (user.experience % 1000) / 10; // 每1000经验升一级

  return (
    <>
      {/* 个人资料头部 */}
      <ProfileHeader>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={8} md={6} style={{ textAlign: 'center' }}>
            <Badge
              count={user.level}
              offset={[-10, 10]}
              style={{ backgroundColor: '#ffd700', fontSize: 16, padding: '2px 8px' }}
            >
              <ProfileAvatar
                size={128}
                icon={<UserOutlined />}
                src={user.avatar}
                style={{ backgroundColor: '#00d4ff' }}
                onClick={() => isOwnProfile && setUploadModalVisible(true)}
              />
            </Badge>
            {isOwnProfile && (
              <Button
                icon={<CameraOutlined />}
                style={{ marginTop: 16 }}
                onClick={() => setUploadModalVisible(true)}
              >
                更换头像
              </Button>
            )}
          </Col>
          
          <Col xs={24} sm={16} md={18}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Space align="center" size="large">
                  <Title level={2} style={{ margin: 0 }}>{user.username}</Title>
                  <Tag color="blue">{user.role}</Tag>
                  {user.statistics.winRate > 60 && (
                    <Tag color="red" icon={<FireOutlined />}>高手</Tag>
                  )}
                </Space>
              </div>
              
              <Paragraph>{user.bio}</Paragraph>
              
              <Space size="large" wrap>
                <Text><MailOutlined /> {user.email}</Text>
                <Text><CalendarOutlined /> 加入于 {formatDate(user.joinDate)}</Text>
                <Text><ClockCircleOutlined /> 最近活跃 {formatDate(user.lastActive)}</Text>
              </Space>
              
              <div>
                <Text>等级 {user.level}</Text>
                <Progress
                  percent={expProgress}
                  strokeColor="#00d4ff"
                  format={() => `${user.experience % 1000}/1000 EXP`}
                />
              </div>
              
              {isOwnProfile && (
                <Space>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => setEditModalVisible(true)}
                  >
                    编辑资料
                  </Button>
                  <Button
                    icon={<SettingOutlined />}
                    onClick={() => navigate('/user/settings')}
                  >
                    账号设置
                  </Button>
                </Space>
              )}
            </Space>
          </Col>
        </Row>
      </ProfileHeader>

      {/* 统计数据 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <StatCard>
            <Statistic
              title="总场次"
              value={user.statistics.totalGames}
              prefix={<PlayCircleOutlined />}
            />
          </StatCard>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatCard>
            <Statistic
              title="胜场"
              value={user.statistics.wins}
              valueStyle={{ color: '#52c41a' }}
            />
          </StatCard>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatCard>
            <Statistic
              title="胜率"
              value={user.statistics.winRate}
              suffix="%"
              precision={1}
              valueStyle={{ color: user.statistics.winRate > 50 ? '#52c41a' : '#ff4d4f' }}
            />
          </StatCard>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatCard>
            <Statistic
              title="总分"
              value={user.statistics.totalScore}
              prefix={<TrophyOutlined />}
            />
          </StatCard>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatCard>
            <Statistic
              title="最高分"
              value={user.statistics.highScore}
              valueStyle={{ color: '#ffd700' }}
            />
          </StatCard>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatCard>
            <Statistic
              title="成就"
              value={user.statistics.achievementsUnlocked}
              prefix={<StarOutlined />}
            />
          </StatCard>
        </Col>
      </Row>

      {/* 详细信息标签页 */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="概览" key="overview">
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Card title="基本信息" size="small">
                  <Descriptions column={1}>
                    <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
                    <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
                    <Descriptions.Item label="角色">{user.role}</Descriptions.Item>
                    <Descriptions.Item label="等级">Lv.{user.level}</Descriptions.Item>
                    <Descriptions.Item label="经验值">{user.experience}</Descriptions.Item>
                    <Descriptions.Item label="注册时间">{formatDate(user.joinDate)}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              
              <Col xs={24} md={12}>
                <Card title="游戏统计" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text>胜/负/平：</Text>
                      <Text strong style={{ marginLeft: 8 }}>
                        {user.statistics.wins}/{user.statistics.losses}/{user.statistics.draws}
                      </Text>
                    </div>
                    <div>
                      <Text>平均分数：</Text>
                      <Text strong style={{ marginLeft: 8 }}>
                        {user.statistics.avgScore.toFixed(0)}
                      </Text>
                    </div>
                    <div>
                      <Text>上传棋谱：</Text>
                      <Text strong style={{ marginLeft: 8 }}>
                        {user.statistics.chessUploaded}
                      </Text>
                    </div>
                    <div>
                      <Text>完成课程：</Text>
                      <Text strong style={{ marginLeft: 8 }}>
                        {user.statistics.coursesCompleted}
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="成就" key="achievements">
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {achievements.map(achievement => (
                <Tooltip
                  key={achievement.id}
                  title={
                    <div>
                      <div>{achievement.description}</div>
                      {achievement.progress !== undefined && (
                        <Progress
                          percent={(achievement.progress / achievement.maxProgress!) * 100}
                          size="small"
                          format={() => `${achievement.progress}/${achievement.maxProgress}`}
                        />
                      )}
                    </div>
                  }
                >
                  <AchievementBadge>
                    <div className="icon" style={{
                      opacity: achievement.unlockedAt ? 1 : 0.3
                    }}>
                      {achievement.icon}
                    </div>
                    <div className="name">{achievement.name}</div>
                    {achievement.unlockedAt && (
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />
                    )}
                  </AchievementBadge>
                </Tooltip>
              ))}
            </div>
          </TabPane>

          <TabPane tab="动态" key="activity">
            <Timeline mode="left">
              {user.recentActivity.map(activity => (
                <Timeline.Item
                  key={activity.id}
                  label={formatDate(activity.timestamp)}
                  color={
                    activity.type === 'game' ? 'blue' :
                    activity.type === 'achievement' ? 'gold' : 'green'
                  }
                >
                  <ActivityItem>
                    <Text>{activity.description}</Text>
                  </ActivityItem>
                </Timeline.Item>
              ))}
            </Timeline>
          </TabPane>

          <TabPane tab="收藏" key="favorites">
            <Empty description="暂无收藏的棋谱" />
          </TabPane>
        </Tabs>
      </Card>

      {/* 编辑资料模态框 */}
      <Modal
        title="编辑个人资料"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            username: user.username,
            email: user.email,
            bio: user.bio
          }}
          onFinish={handleEditProfile}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="bio" label="个人简介">
            <Input.TextArea rows={4} maxLength={200} showCount />
          </Form.Item>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setEditModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 上传头像模态框 */}
      <Modal
        title="更换头像"
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        <ImgCrop rotate>
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={handleAvatarUpload}
          >
            <Button icon={<CameraOutlined />} size="large" block>
              选择图片
            </Button>
          </Upload>
        </ImgCrop>
      </Modal>
    </>
  );
};

export default Profile;