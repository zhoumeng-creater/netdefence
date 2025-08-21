// 文件路径：frontend/src/modules/chess/ChessDetail.tsx
// 状态：修改现有文件（原文件只有Empty组件）

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Rate,
  Tabs,
  Avatar,
  Space,
  Divider,
  message,
  Spin,
  Empty,
  Typography,
  Statistic,
  Tooltip,
  Modal,
  Input,
  List,
  Form
} from 'antd';
import {
  PlayCircleOutlined,
  BarChartOutlined,
  HeartOutlined,
  HeartFilled,
  CommentOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  TagsOutlined,
  LikeOutlined,
  MessageOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { chessApi } from '@/services/api';
import { useAppSelector } from '@/store';
import { formatDate } from '@/utils/format';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

// 样式组件
const DetailCard = styled(Card)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.2);
  
  .ant-card-head {
    background: rgba(0, 212, 255, 0.05);
    border-bottom: 1px solid rgba(0, 212, 255, 0.2);
  }
`;

const InfoSection = styled.div`
  padding: 16px;
  background: rgba(0, 212, 255, 0.02);
  border-radius: 8px;
  margin-bottom: 16px;
`;

const ActionButton = styled(Button)`
  &:hover {
    border-color: #00d4ff;
    color: #00d4ff;
  }
`;

const CommentItem = styled.div`
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid rgba(0, 212, 255, 0.1);
  transition: all 0.3s;
  
  &:hover {
    border-color: rgba(0, 212, 255, 0.3);
    background: rgba(0, 212, 255, 0.03);
  }
`;

// 类型定义
interface ChessDetailData {
  id: string;
  title: string;
  description: string;
  type: string;
  visibility: string;
  content: any;
  tags: string[];
  rating: number;
  playCount: number;
  downloadCount: number;
  favoriteCount: number;
  commentCount: number;
  averageRating: number;
  userRating?: number;
  isFavorite?: boolean;
  author: {
    id: string;
    username: string;
    avatar?: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  content: string;
  userId: string;
  username: string;
  avatar?: string;
  createdAt: string;
  likes: number;
  replies?: Comment[];
}

export const ChessDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAppSelector(state => state.auth.user);
  
  const [loading, setLoading] = useState(true);
  const [chessData, setChessData] = useState<ChessDetailData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 获取棋谱详情
  useEffect(() => {
    if (id) {
      fetchChessDetail();
      fetchComments();
    }
  }, [id]);

  const fetchChessDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chess/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setChessData(result.data);
        setIsFavorite(result.data.isFavorite || false);
        setUserRating(result.data.userRating || 0);
      } else {
        message.error('获取棋谱详情失败');
      }
    } catch (error) {
      console.error('获取棋谱详情失败:', error);
      message.error('获取棋谱详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const response = await fetch(`/api/chess/${id}/comments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setComments(result.data || []);
      }
    } catch (error) {
      console.error('获取评论失败:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  // 收藏/取消收藏
  const handleFavorite = async () => {
    if (!currentUser) {
      message.warning('请先登录');
      return;
    }

    try {
      const response = await fetch(`/api/chess/${id}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setIsFavorite(!isFavorite);
        message.success(isFavorite ? '已取消收藏' : '已收藏');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 评分
  const handleRate = async (value: number) => {
    if (!currentUser) {
      message.warning('请先登录');
      return;
    }

    try {
      const response = await fetch(`/api/chess/${id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ score: value })
      });
      
      if (response.ok) {
        setUserRating(value);
        message.success('评分成功');
        fetchChessDetail(); // 刷新平均评分
      }
    } catch (error) {
      message.error('评分失败');
    }
  };

  // 提交评论
  const handleComment = async (values: any) => {
    if (!currentUser) {
      message.warning('请先登录');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/chess/${id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: values.content })
      });
      
      if (response.ok) {
        message.success('评论成功');
        setShowCommentModal(false);
        commentForm.resetFields();
        fetchComments();
      }
    } catch (error) {
      message.error('评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 下载棋谱
  const handleDownload = async () => {
    if (!currentUser) {
      message.warning('请先登录');
      return;
    }

    try {
      const response = await fetch(`/api/chess/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${chessData?.title || 'chess'}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        message.success('下载成功');
      }
    } catch (error) {
      message.error('下载失败');
    }
  };

  // 分享功能
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      message.success('链接已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="加载中..." />
        </div>
      </Card>
    );
  }

  if (!chessData) {
    return (
      <Card>
        <Empty description="棋谱不存在" />
      </Card>
    );
  }

  return (
    <>
      <Row gutter={[16, 16]}>
        {/* 主要内容区域 */}
        <Col xs={24} lg={18}>
          <DetailCard>
            {/* 标题和操作栏 */}
            <div style={{ marginBottom: 24 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Title level={2}>{chessData.title}</Title>
                <Space split={<Divider type="vertical" />}>
                  <Tag color={chessData.type === 'OFFICIAL' ? 'blue' : 'green'}>
                    {chessData.type === 'OFFICIAL' ? '官方棋谱' : '用户棋谱'}
                  </Tag>
                  <Tag color={chessData.visibility === 'PUBLIC' ? 'cyan' : 'orange'}>
                    {chessData.visibility === 'PUBLIC' ? '公开' : '私有'}
                  </Tag>
                  <Text type="secondary">
                    <ClockCircleOutlined /> {formatDate(chessData.createdAt)}
                  </Text>
                </Space>
              </Space>
            </div>

            {/* 描述 */}
            {chessData.description && (
              <InfoSection>
                <Paragraph>{chessData.description}</Paragraph>
              </InfoSection>
            )}

            {/* 标签 */}
            {chessData.tags && chessData.tags.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Space>
                  <TagsOutlined />
                  {chessData.tags.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
              </div>
            )}

            {/* 操作按钮 */}
            <Space size="middle" wrap style={{ marginBottom: 24 }}>
              <ActionButton
                type="primary"
                icon={<PlayCircleOutlined />}
                size="large"
                onClick={() => navigate(`/chess/replay/${chessData.id}`)}
              >
                回放对战
              </ActionButton>
              <ActionButton
                icon={<BarChartOutlined />}
                size="large"
                onClick={() => navigate(`/chess/analysis/${chessData.id}`)}
              >
                查看分析
              </ActionButton>
              <ActionButton
                icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
                size="large"
                onClick={handleFavorite}
                style={isFavorite ? { color: '#ff4d4f' } : {}}
              >
                {isFavorite ? '已收藏' : '收藏'}
              </ActionButton>
              <ActionButton
                icon={<DownloadOutlined />}
                size="large"
                onClick={handleDownload}
              >
                下载
              </ActionButton>
              <ActionButton
                icon={<ShareAltOutlined />}
                size="large"
                onClick={handleShare}
              >
                分享
              </ActionButton>
            </Space>

            {/* 评分 */}
            <InfoSection>
              <Space align="center" size="large">
                <div>
                  <Text>平均评分：</Text>
                  <Rate disabled value={chessData.averageRating} allowHalf />
                  <Text style={{ marginLeft: 8 }}>
                    {chessData.averageRating.toFixed(1)}
                  </Text>
                </div>
                <Divider type="vertical" />
                <div>
                  <Text>您的评分：</Text>
                  <Rate
                    value={userRating}
                    onChange={handleRate}
                    disabled={!currentUser}
                  />
                </div>
              </Space>
            </InfoSection>

            {/* 评论区 */}
            <Card
              title="评论区"
              extra={
                <Button
                  type="primary"
                  icon={<CommentOutlined />}
                  onClick={() => setShowCommentModal(true)}
                  disabled={!currentUser}
                >
                  发表评论
                </Button>
              }
              style={{ marginTop: 24 }}
            >
              {commentsLoading ? (
                <Spin />
              ) : comments.length === 0 ? (
                <Empty description="暂无评论，快来发表第一条评论吧！" />
              ) : (
                <List
                  dataSource={comments}
                  renderItem={(comment) => (
                    <CommentItem key={comment.id}>
                      <Space align="start">
                        <Avatar icon={<UserOutlined />}>
                          {comment.username[0]?.toUpperCase()}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                          <Space>
                            <Text strong>{comment.username}</Text>
                            <Text type="secondary">
                              {formatDate(comment.createdAt)}
                            </Text>
                          </Space>
                          <Paragraph style={{ marginTop: 8, marginBottom: 8 }}>
                            {comment.content}
                          </Paragraph>
                          <Space>
                            <Button
                              type="text"
                              size="small"
                              icon={<LikeOutlined />}
                            >
                              {comment.likes || 0}
                            </Button>
                            <Button
                              type="text"
                              size="small"
                              icon={<MessageOutlined />}
                            >
                              回复
                            </Button>
                          </Space>
                        </div>
                      </Space>
                    </CommentItem>
                  )}
                />
              )}
            </Card>
          </DetailCard>
        </Col>

        {/* 侧边栏信息 */}
        <Col xs={24} lg={6}>
          {/* 作者信息 */}
          <DetailCard title="作者信息" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Avatar size={48} icon={<UserOutlined />}>
                  {chessData.author.username[0]?.toUpperCase()}
                </Avatar>
                <div>
                  <div>
                    <Text strong>{chessData.author.username}</Text>
                  </div>
                  <div>
                    <Tag color="blue">{chessData.author.role}</Tag>
                  </div>
                </div>
              </Space>
              <Button
                block
                onClick={() => navigate(`/user/profile/${chessData.author.id}`)}
              >
                查看主页
              </Button>
            </Space>
          </DetailCard>

          {/* 统计信息 */}
          <DetailCard title="统计信息">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="播放次数"
                  value={chessData.playCount || 0}
                  prefix={<EyeOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="下载次数"
                  value={chessData.downloadCount || 0}
                  prefix={<DownloadOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="收藏数"
                  value={chessData.favoriteCount || 0}
                  prefix={<HeartOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="评论数"
                  value={chessData.commentCount || 0}
                  prefix={<CommentOutlined />}
                />
              </Col>
            </Row>
          </DetailCard>
        </Col>
      </Row>

      {/* 评论模态框 */}
      <Modal
        title="发表评论"
        visible={showCommentModal}
        onCancel={() => setShowCommentModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={commentForm}
          onFinish={handleComment}
          layout="vertical"
        >
          <Form.Item
            name="content"
            rules={[
              { required: true, message: '请输入评论内容' },
              { min: 5, message: '评论内容至少5个字符' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="请输入评论内容..."
              maxLength={500}
              showCount
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setShowCommentModal(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                发表评论
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ChessDetail;