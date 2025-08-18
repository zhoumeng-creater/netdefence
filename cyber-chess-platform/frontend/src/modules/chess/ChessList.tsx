import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Space, message, Empty } from 'antd';
import { PlusOutlined, EyeOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { chessApi } from '@/services/api';

export const ChessList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [chessList, setChessList] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchChessList();
  }, [pagination.current, pagination.pageSize]);

  const fetchChessList = async () => {
    setLoading(true);
    try {
      const response = await chessApi.getChessList({
        page: pagination.current,
        limit: pagination.pageSize
      });
      
      // 注意：response 直接就是数据，根据 PaginatedResponse 类型
      if (response && typeof response === 'object') {
        setChessList(response.items || []);
        setPagination(prev => ({
          ...prev,
          total: response.total || 0
        }));
      }
    } catch (error) {
      console.error('获取棋谱列表失败:', error);
      message.error('获取棋谱列表失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: '35%',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: '10%',
      render: (type: string) => (
        <Tag color={type === 'OFFICIAL' ? 'blue' : 'green'}>
          {type === 'OFFICIAL' ? '官方' : '用户'}
        </Tag>
      ),
    },
    {
      title: '作者',
      dataIndex: ['author', 'username'],
      key: 'author',
      width: '15%',
    },
    {
      title: '可见性',
      dataIndex: 'visibility',
      key: 'visibility',
      width: '10%',
      render: (visibility: string) => (
        <Tag color={visibility === 'PUBLIC' ? 'cyan' : 'orange'}>
          {visibility === 'PUBLIC' ? '公开' : '私有'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '15%',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      width: '15%',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            type="link" 
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/chess/${record.id}`)}
          >
            查看
          </Button>
          <Button 
            type="link" 
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => navigate(`/chess/replay/${record.id}`)}
          >
            回放
          </Button>
        </Space>
      ),
    },
  ];

  const handleTableChange = (pag: any) => {
    setPagination({
      current: pag.current || 1,
      pageSize: pag.pageSize || 10,
      total: pagination.total
    });
  };

  return (
    <Card 
      title="棋谱库" 
      extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => navigate('/chess/upload')}
        >
          上传棋谱
        </Button>
      }
    >
      {chessList.length === 0 && !loading ? (
        <Empty description="暂无棋谱数据" />
      ) : (
        <Table
          columns={columns}
          dataSource={chessList}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50']
          }}
          onChange={handleTableChange}
        />
      )}
    </Card>
  );
};

export default ChessList;