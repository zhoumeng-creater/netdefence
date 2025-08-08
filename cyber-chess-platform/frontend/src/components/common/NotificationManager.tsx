import React, { useEffect } from 'react';
import { notification, message } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '@/store';
import { uiActions } from '@/store';
import { useWebSocket } from '@/hooks/useWebSocket';

// 配置通知
notification.config({
  placement: 'topRight',
  duration: 4,
  maxCount: 3,
});

message.config({
  top: 100,
  duration: 3,
  maxCount: 3,
});

const NotificationManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { notifications } = useAppSelector(state => state.ui);
  const { on, off } = useWebSocket();

  useEffect(() => {
    // 处理通知队列
    notifications.forEach(notif => {
      const icon = {
        success: <CheckCircleOutlined style={{ color: '#00ff88' }} />,
        error: <CloseCircleOutlined style={{ color: '#ff0080' }} />,
        warning: <ExclamationCircleOutlined style={{ color: '#ffd700' }} />,
        info: <InfoCircleOutlined style={{ color: '#00d4ff' }} />,
      }[notif.type];

      notification[notif.type]({
        key: notif.id,
        message: notif.title,
        description: notif.message,
        icon,
        duration: notif.duration,
        onClose: () => {
          dispatch(uiActions.removeNotification(notif.id));
        },
        style: {
          background: 'rgba(26, 35, 50, 0.95)',
          border: `1px solid ${
            notif.type === 'success' ? '#00ff88' :
            notif.type === 'error' ? '#ff0080' :
            notif.type === 'warning' ? '#ffd700' : '#00d4ff'
          }`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        },
      });
    });
  }, [notifications, dispatch]);

  useEffect(() => {
    // WebSocket事件监听
    const handleSystemNotification = (data: any) => {
      dispatch(uiActions.addNotification({
        id: Date.now().toString(),
        type: data.type || 'info',
        title: data.title,
        message: data.message,
        duration: data.duration,
      }));
    };

    const handleGameInvite = (data: any) => {
      const key = `game-invite-${Date.now()}`;
      notification.info({
        key,
        message: '游戏邀请',
        description: `${data.fromUser} 邀请您加入游戏`,
        duration: 10,
        btn: (
          <div>
            <button
              onClick={() => {
                // 接受邀请
                window.location.href = `/game/play/${data.gameId}`;
                notification.close(key);
              }}
              style={{
                marginRight: 8,
                padding: '4px 12px',
                background: '#00d4ff',
                border: 'none',
                borderRadius: 4,
                color: '#000',
                cursor: 'pointer',
              }}
            >
              接受
            </button>
            <button
              onClick={() => notification.close(key)}
              style={{
                padding: '4px 12px',
                background: 'transparent',
                border: '1px solid #ff0080',
                borderRadius: 4,
                color: '#ff0080',
                cursor: 'pointer',
              }}
            >
              拒绝
            </button>
          </div>
        ),
      });
    };

    const handleAchievement = (data: any) => {
      notification.success({
        message: '🏆 成就解锁！',
        description: data.achievement,
        duration: 6,
        style: {
          background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 212, 255, 0.1))',
          border: '2px solid #00ff88',
        },
      });
    };

    const handleSystemUpdate = (data: any) => {
      notification.warning({
        message: '系统更新',
        description: data.message,
        duration: 0, // 不自动关闭
      });
    };

    // 注册事件监听
    on('notification', handleSystemNotification);
    on('game:invite', handleGameInvite);
    on('achievement:unlock', handleAchievement);
    on('system:update', handleSystemUpdate);

    // 清理函数
    return () => {
      off('notification', handleSystemNotification);
      off('game:invite', handleGameInvite);
      off('achievement:unlock', handleAchievement);
      off('system:update', handleSystemUpdate);
    };
  }, [on, off, dispatch]);

  // 此组件不渲染任何内容
  return null;
};

export default NotificationManager;