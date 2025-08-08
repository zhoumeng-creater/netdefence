// =====================================================
// 课程模块核心文件 - Course Module Core Files
// =====================================================

// src/modules/course/CourseList.tsx
import React, { useState } from 'react';
import { Card, Row, Col, Input, Select, Tag, Rate, Button, Badge } from 'antd';
import { SearchOutlined, FilterOutlined, PlayCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { CourseCategory, CourseDifficulty } from '@/types';

const { Search } = Input;
const { Option } = Select;

const CourseCard = styled(Card)`
  height: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 212, 255, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    border-color: #00d4ff;
    box-shadow: 0 10px 30px rgba(0, 212, 255, 0.2);
  }
  
  .ant-card-cover {
    height: 200px;
    background: linear-gradient(135deg, #00d4ff, #ff0080);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
  }
`;

export const CourseList: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState<CourseCategory | 'all'>('all');
  const [difficulty, setDifficulty] = useState<CourseDifficulty | 'all'>('all');

  // 模拟课程数据
  const courses = [
    {
      id: '1',
      title: 'Web安全基础',
      description: '学习常见的Web安全漏洞和防护方法',
      category: CourseCategory.BASIC,
      difficulty: CourseDifficulty.BEGINNER,
      duration: 120,
      enrollment: 1234,
      rating: 4.5,
      price: 0,
    },
    // ... 更多课程
  ];

  const getDifficultyColor = (difficulty: CourseDifficulty) => {
    const colors = {
      [CourseDifficulty.BEGINNER]: 'green',
      [CourseDifficulty.INTERMEDIATE]: 'blue',
      [CourseDifficulty.ADVANCED]: 'orange',
      [CourseDifficulty.EXPERT]: 'red',
    };
    return colors[difficulty];
  };

  return (
    <div>
      {/* 搜索和筛选栏 */}
      <Card style={{ marginBottom: 24, background: 'rgba(255, 255, 255, 0.02)' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索课程..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择分类"
              value={category}
              onChange={setCategory}
            >
              <Option value="all">全部分类</Option>
              <Option value={CourseCategory.BASIC}>基础入门</Option>
              <Option value={CourseCategory.ATTACK}>攻击技术</Option>
              <Option value={CourseCategory.DEFENSE}>防御技术</Option>
              <Option value={CourseCategory.ANALYSIS}>事件分析</Option>
              <Option value={CourseCategory.PRACTICE}>实战演练</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择难度"
              value={difficulty}
              onChange={setDifficulty}
            >
              <Option value="all">全部难度</Option>
              <Option value={CourseDifficulty.BEGINNER}>入门</Option>
              <Option value={CourseDifficulty.INTERMEDIATE}>初级</Option>
              <Option value={CourseDifficulty.ADVANCED}>中级</Option>
              <Option value={CourseDifficulty.EXPERT}>高级</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 课程列表 */}
      <Row gutter={[24, 24]}>
        {courses.map(course => (
          <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
            <CourseCard
              hoverable
              cover={
                <div className="ant-card-cover">
                  <PlayCircleOutlined style={{ color: 'white' }} />
                </div>
              }
              actions={[
                <Button type="primary" block>开始学习</Button>
              ]}
            >
              <Card.Meta
                title={course.title}
                description={
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 12 }}>
                      {course.description}
                    </p>
                    <div style={{ marginBottom: 8 }}>
                      <Tag color={getDifficultyColor(course.difficulty)}>
                        {course.difficulty}
                      </Tag>
                      <Tag color="blue">{course.category}</Tag>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Rate disabled defaultValue={course.rating} style={{ fontSize: 14 }} />
                      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                        <ClockCircleOutlined /> {course.duration}分钟
                      </span>
                    </div>
                    <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.65)' }}>
                      {course.enrollment} 人学习
                    </div>
                  </div>
                }
              />
              {course.price === 0 && (
                <Badge.Ribbon text="免费" color="green" />
              )}
            </CourseCard>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default CourseList;