import React, { useState } from 'react';
import { Layout, Menu, Input, Badge, Avatar, Dropdown, Space, Button, Tooltip } from 'antd';
import {
  SearchOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  DashboardOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  MoonOutlined,
  SunOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '@/hooks/useAuth';
import { useAppSelector, useAppDispatch } from '@/store';
import { uiActions } from '@/store';

const { Header: AntHeader } = Layout;
const { Search } = Input;

const StyledHeader = styled(AntHeader)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 64px;
  padding: 0 24px;
  background: rgba(15, 20, 25, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  margin-right: 32px;
  
  .logo-icon {
    width: 32px;
    height: 32px;
    background: linear-gradient(45deg, #00d4ff, #ff0080);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    color: white;
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
  }
  
  .logo-text {
    font-size: 20px;
    font-weight: bold;
    background: linear-gradient(90deg, #00d4ff, #ff0080);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 1px;
  }
`;

const SearchWrapper = styled.div`
  flex: 1;
  max-width: 400px;
  margin: 0 24px;
  
  .ant-input-search {
    .ant-input {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
      color: white;
      
      &:hover, &:focus {
        border-color: #00d4ff;
        background: rgba(0, 212, 255, 0.05);
      }
    }
    
    .ant-input-search-button {
      background: linear-gradient(135deg, #00d4ff, #0099cc);
      border: none;
      
      &:hover {
        background: linear-gradient(135deg, #00a8cc, #0077aa);
      }
    }
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const NotificationBadge = styled(Badge)`
  .ant-badge-dot {
    background: #ff0080;
    box-shadow: 0 0 10px #ff0080;
  }
`;

const UserAvatar = styled(Avatar)`
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #00d4ff;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
  }
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background: #00ff88;
  border: 2px solid #0f1419;
  border-radius: 50%;
  box-shadow: 0 0 10px #00ff88;
`;

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin, getAvatar, getDisplayName } = useAuth();
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector(state => state.ui);
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value)}`);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    dispatch(uiActions.setTheme(newTheme));
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/user/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/user/settings'),
    },
    ...(isAdmin() ? [{
      key: 'admin',
      icon: <DashboardOutlined />,
      label: '管理后台',
      onClick: () => navigate('/admin'),
    }] : []),
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
      danger: true,
    },
  ];

  const notificationMenu = [
    {
      key: '1',
      label: (
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontWeight: 'bold' }}>系统通知</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
            新版本已发布，查看更新内容
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
            5分钟前
          </div>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontWeight: 'bold' }}>游戏邀请</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
            玩家 CyberMaster 邀请您对战
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
            10分钟前
          </div>
        </div>
      ),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'all',
      label: '查看全部通知',
      onClick: () => navigate('/notifications'),
    },
  ];

  return (
    <StyledHeader>
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <Logo onClick={() => navigate('/')}>
          <div className="logo-icon">
            <ThunderboltOutlined />
          </div>
          <div className="logo-text">Cyber Chess</div>
        </Logo>
        
        <SearchWrapper>
          <Search
            placeholder="搜索棋谱、课程、用户..."
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            size="middle"
            enterButton
            prefix={<SearchOutlined />}
          />
        </SearchWrapper>
      </div>

      <RightSection>
        <Tooltip title="切换主题">
          <Button
            type="text"
            icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            style={{ color: 'rgba(255,255,255,0.85)' }}
          />
        </Tooltip>

        <Tooltip title="语言">
          <Button
            type="text"
            icon={<TranslationOutlined />}
            style={{ color: 'rgba(255,255,255,0.85)' }}
          />
        </Tooltip>

        <Dropdown
          menu={{ items: notificationMenu }}
          placement="bottomRight"
          trigger={['click']}
        >
          <div style={{ cursor: 'pointer' }}>
            <NotificationBadge dot count={2}>
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ color: 'rgba(255,255,255,0.85)' }}
              />
            </NotificationBadge>
          </div>
        </Dropdown>

        {user && (
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Space style={{ cursor: 'pointer', position: 'relative' }}>
              <UserAvatar src={getAvatar()} size={32}>
                {getDisplayName()[0].toUpperCase()}
              </UserAvatar>
              <OnlineIndicator />
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>
                {getDisplayName()}
              </span>
            </Space>
          </Dropdown>
        )}
      </RightSection>
    </StyledHeader>
  );
};

export default Header;