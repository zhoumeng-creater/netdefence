import React, { useEffect, useState } from 'react';
import { Layout, Menu, Badge } from 'antd';
import {
  HomeOutlined,
  PlayCircleOutlined,
  DatabaseOutlined,
  BookOutlined,
  BulbOutlined,
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  BarChartOutlined,
  SettingOutlined,
  DashboardOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  ExperimentOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '@/hooks/useAuth';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

const StyledSider = styled(Sider)`
  position: fixed;
  left: 0;
  top: 64px;
  height: calc(100vh - 64px);
  background: rgba(26, 35, 50, 0.95) !important;
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(0, 212, 255, 0.1);
  z-index: 999;
  overflow-y: auto;
  overflow-x: hidden;
  
  .ant-layout-sider-children {
    display: flex;
    flex-direction: column;
  }
  
  .ant-menu {
    background: transparent;
    border: none;
    flex: 1;
    
    .ant-menu-item {
      margin: 4px 8px;
      border-radius: 8px;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(0, 212, 255, 0.1);
      }
      
      &.ant-menu-item-selected {
        background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(255, 0, 128, 0.1));
        border-left: 3px solid #00d4ff;
        
        &::after {
          display: none;
        }
      }
    }
    
    .ant-menu-submenu {
      .ant-menu-submenu-title {
        margin: 4px 8px;
        border-radius: 8px;
        
        &:hover {
          background: rgba(0, 212, 255, 0.1);
        }
      }
      
      &.ant-menu-submenu-selected {
        > .ant-menu-submenu-title {
          color: #00d4ff;
        }
      }
    }
  }
  
  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 212, 255, 0.3);
    border-radius: 2px;
    
    &:hover {
      background: rgba(0, 212, 255, 0.5);
    }
  }
`;

const MenuSection = styled.div`
  padding: 8px 16px;
  margin-top: 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
`;

const QuickStats = styled.div`
  padding: 16px;
  margin: 16px;
  background: rgba(0, 212, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(0, 212, 255, 0.2);
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  
  .label {
    color: rgba(255, 255, 255, 0.65);
    font-size: 12px;
  }
  
  .value {
    color: #00d4ff;
    font-weight: bold;
    font-size: 14px;
  }
`;

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isInstructor, user } = useAuth();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    const path = location.pathname;
    setSelectedKeys([path]);
    
    // 自动展开当前菜单
    if (path.startsWith('/game')) setOpenKeys(['game']);
    else if (path.startsWith('/chess')) setOpenKeys(['chess']);
    else if (path.startsWith('/course')) setOpenKeys(['course']);
    else if (path.startsWith('/user')) setOpenKeys(['user']);
    else if (path.startsWith('/admin')) setOpenKeys(['admin']);
  }, [location.pathname]);

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/'),
    },
    {
      key: 'game',
      icon: <PlayCircleOutlined />,
      label: '游戏对战',
      children: [
        {
          key: '/game',
          icon: <RocketOutlined />,
          label: '游戏大厅',
          onClick: () => navigate('/game'),
        },
        {
          key: '/game/play',
          icon: <ExperimentOutlined />,
          label: '开始游戏',
          onClick: () => navigate('/game/play'),
        },
        {
          key: '/game/history',
          icon: <FileTextOutlined />,
          label: '对战记录',
          onClick: () => navigate('/game/history'),
        },
      ],
    },
    {
      key: 'chess',
      icon: <DatabaseOutlined />,
      label: (
        <span>
          棋谱管理
          <Badge count={5} size="small" style={{ marginLeft: 8 }} />
        </span>
      ),
      children: [
        {
          key: '/chess',
          icon: <GlobalOutlined />,
          label: '棋谱库',
          onClick: () => navigate('/chess'),
        },
        {
          key: '/chess/upload',
          icon: <PlayCircleOutlined />,
          label: '上传棋谱',
          onClick: () => navigate('/chess/upload'),
        },
      ],
    },
    {
      key: 'course',
      icon: <BookOutlined />,
      label: '安全课程',
      children: [
        {
          key: '/course',
          icon: <BookOutlined />,
          label: '课程列表',
          onClick: () => navigate('/course'),
        },
        {
          key: '/course/my-courses',
          icon: <SafetyCertificateOutlined />,
          label: '我的课程',
          onClick: () => navigate('/course/my-courses'),
        },
        {
          key: '/events',
          icon: <BulbOutlined />,
          label: '安全事件库',
          onClick: () => navigate('/events'),
        },
        ...(isInstructor() ? [
          {
            key: '/course/create',
            icon: <FileTextOutlined />,
            label: '创建课程',
            onClick: () => navigate('/course/create'),
          },
        ] : []),
      ],
    },
    {
      key: 'community',
      icon: <TeamOutlined />,
      label: '社区',
      children: [
        {
          key: '/leaderboard',
          icon: <TrophyOutlined />,
          label: '排行榜',
          onClick: () => navigate('/leaderboard'),
        },
        {
          key: '/tournaments',
          icon: <TrophyOutlined />,
          label: '竞赛',
          onClick: () => navigate('/tournaments'),
        },
        {
          key: '/forum',
          icon: <TeamOutlined />,
          label: '论坛',
          onClick: () => navigate('/forum'),
        },
      ],
    },
    {
      key: 'user',
      icon: <UserOutlined />,
      label: '个人中心',
      children: [
        {
          key: '/user/profile',
          icon: <UserOutlined />,
          label: '个人资料',
          onClick: () => navigate('/user/profile'),
        },
        {
          key: '/user/achievements',
          icon: <TrophyOutlined />,
          label: '成就',
          onClick: () => navigate('/user/achievements'),
        },
        {
          key: '/user/statistics',
          icon: <BarChartOutlined />,
          label: '数据统计',
          onClick: () => navigate('/user/statistics'),
        },
        {
          key: '/user/settings',
          icon: <SettingOutlined />,
          label: '设置',
          onClick: () => navigate('/user/settings'),
        },
      ],
    },
    ...(isAdmin() ? [
      {
        key: 'admin',
        icon: <DashboardOutlined />,
        label: '管理后台',
        children: [
          {
            key: '/admin',
            icon: <DashboardOutlined />,
            label: '仪表板',
            onClick: () => navigate('/admin'),
          },
          {
            key: '/admin/users',
            icon: <TeamOutlined />,
            label: '用户管理',
            onClick: () => navigate('/admin/users'),
          },
          {
            key: '/admin/content',
            icon: <FileTextOutlined />,
            label: '内容管理',
            onClick: () => navigate('/admin/content'),
          },
          {
            key: '/admin/settings',
            icon: <SettingOutlined />,
            label: '系统设置',
            onClick: () => navigate('/admin/settings'),
          },
        ],
      },
    ] : []),
  ];

  return (
    <StyledSider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={256}
      collapsedWidth={80}
    >
      {!collapsed && <MenuSection>导航菜单</MenuSection>}
      
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        openKeys={collapsed ? [] : openKeys}
        onOpenChange={setOpenKeys}
        items={menuItems}
        style={{ borderRight: 0 }}
      />
      
      {!collapsed && user && (
        <QuickStats>
          <StatItem>
            <span className="label">今日对战</span>
            <span className="value">5</span>
          </StatItem>
          <StatItem>
            <span className="label">胜率</span>
            <span className="value">68%</span>
          </StatItem>
          <StatItem>
            <span className="label">积分</span>
            <span className="value">2,450</span>
          </StatItem>
          <StatItem>
            <span className="label">排名</span>
            <span className="value">#42</span>
          </StatItem>
        </QuickStats>
      )}
    </StyledSider>
  );
};

export default Sidebar;