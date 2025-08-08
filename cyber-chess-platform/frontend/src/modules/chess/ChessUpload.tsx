// =====================================================
// 棋谱模块核心文件 - Chess Module Core Files
// =====================================================

// src/modules/chess/ChessUpload.tsx
import React, { useState } from 'react';
import { Card, Upload, Form, Input, Select, Tag, Button, message } from 'antd';
import { InboxOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { ChessType, ChessVisibility } from '@/types';

const { Dragger } = Upload;
const { TextArea } = Input;
const { Option } = Select;

export const ChessUpload: React.FC = () => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (values: any) => {
    setUploading(true);
    // TODO: 实现上传逻辑
    console.log('Uploading chess record:', values);
    setTimeout(() => {
      setUploading(false);
      message.success('棋谱上传成功！');
    }, 2000);
  };

  return (
    <Card title="📤 上传棋谱" style={{ maxWidth: 800, margin: '0 auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleUpload}
      >
        <Form.Item
          name="file"
          label="棋谱文件"
          rules={[{ required: true, message: '请选择棋谱文件' }]}
        >
          <Dragger
            accept=".json,.pgn"
            beforeUpload={() => false}
            style={{ background: 'rgba(0, 212, 255, 0.05)' }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: '#00d4ff', fontSize: 48 }} />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持 JSON、PGN 格式的棋谱文件
            </p>
          </Dragger>
        </Form.Item>

        <Form.Item
          name="title"
          label="棋谱标题"
          rules={[{ required: true, message: '请输入棋谱标题' }]}
        >
          <Input placeholder="请输入棋谱标题" />
        </Form.Item>

        <Form.Item
          name="description"
          label="棋谱描述"
        >
          <TextArea rows={4} placeholder="请输入棋谱描述" />
        </Form.Item>

        <Form.Item
          name="type"
          label="棋谱类型"
          rules={[{ required: true, message: '请选择棋谱类型' }]}
        >
          <Select placeholder="请选择棋谱类型">
            <Option value={ChessType.OFFICIAL}>官方棋谱</Option>
            <Option value={ChessType.TEACHING}>教学棋谱</Option>
            <Option value={ChessType.USER}>用户棋谱</Option>
            <Option value={ChessType.COMPETITION}>比赛棋谱</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="visibility"
          label="可见性"
          rules={[{ required: true, message: '请选择可见性' }]}
        >
          <Select placeholder="请选择可见性">
            <Option value={ChessVisibility.PUBLIC}>公开</Option>
            <Option value={ChessVisibility.PRIVATE}>私有</Option>
            <Option value={ChessVisibility.RESTRICTED}>限制访问</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="tags"
          label="标签"
        >
          <Select mode="tags" placeholder="输入标签后按回车">
            <Option value="APT">APT</Option>
            <Option value="DDoS">DDoS</Option>
            <Option value="社工">社工</Option>
            <Option value="0day">0day</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={uploading}
            icon={<CloudUploadOutlined />}
            block
            size="large"
          >
            上传棋谱
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ChessUpload;