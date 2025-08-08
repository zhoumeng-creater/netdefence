# API Documentation

## 网络安全棋谱对抗系统 API 文档

### 基础信息

- **Base URL**: `https://api.cyberchess.com`
- **API Version**: v1.0.0
- **认证方式**: Bearer Token (JWT)

### 请求格式

所有请求必须包含以下 headers：

```http
Content-Type: application/json
Authorization: Bearer <token>
```

### 响应格式

所有响应均为 JSON 格式：

```json
{
  "success": true,
  "message": "操作成功",
  "data": {},
  "error": null
}
```

错误响应：

```json
{
  "success": false,
  "message": "错误描述",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

---

## 认证接口 (Authentication)

### 注册
`POST /api/auth/register`

请求体：
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "role": "USER"
    },
    "tokens": {
      "accessToken": "string",
      "refreshToken": "string"
    }
  }
}
```

### 登录
`POST /api/auth/login`

请求体：
```json
{
  "username": "string", // 或使用 email
  "password": "string"
}
```

### 刷新令牌
`POST /api/auth/refresh-token`

请求体：
```json
{
  "refreshToken": "string"
}
```

### 登出
`POST /api/auth/logout`

需要认证：是

请求体：
```json
{
  "refreshToken": "string" // 可选
}
```

### 修改密码
`POST /api/auth/change-password`

需要认证：是

请求体：
```json
{
  "oldPassword": "string",
  "newPassword": "string"
}
```

---

## 棋谱接口 (Chess Records)

### 获取棋谱列表
`GET /api/chess`

查询参数：
- `page` (number): 页码，默认 1
- `limit` (number): 每页数量，默认 10
- `type` (string): 棋谱类型 (OFFICIAL|TEACHING|USER|COMPETITION)
- `visibility` (string): 可见性 (PUBLIC|PRIVATE|RESTRICTED)
- `tags` (string[]): 标签筛选
- `sort` (string): 排序方式 (asc|desc)
- `sortBy` (string): 排序字段

响应：
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "type": "OFFICIAL",
      "visibility": "PUBLIC",
      "tags": ["tag1", "tag2"],
      "rating": 4.5,
      "playCount": 100,
      "author": {
        "id": "uuid",
        "username": "string",
        "avatar": "url"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 获取棋谱详情
`GET /api/chess/:id`

响应：
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "type": "OFFICIAL",
    "content": {
      "gameState": {},
      "moves": [],
      "players": []
    },
    "visibility": "PUBLIC",
    "tags": ["tag1", "tag2"],
    "rating": 4.5,
    "playCount": 100,
    "averageRating": 4.5,
    "userRating": 5,
    "isFavorite": true,
    "author": {
      "id": "uuid",
      "username": "string",
      "avatar": "url",
      "role": "USER"
    }
  }
}
```

### 上传棋谱
`POST /api/chess/upload`

需要认证：是

请求体（multipart/form-data）：
- `title` (string): 标题
- `description` (string): 描述
- `type` (string): 类型
- `content` (string/file): 棋谱内容或文件
- `visibility` (string): 可见性
- `tags` (string[]): 标签
- `file` (file): 棋谱文件（可选）

### 更新棋谱
`PUT /api/chess/:id`

需要认证：是
权限要求：作者或管理员

### 删除棋谱
`DELETE /api/chess/:id`

需要认证：是
权限要求：作者或管理员

### 获取棋谱回放
`GET /api/chess/:id/replay`

响应：
```json
{
  "success": true,
  "data": {
    "title": "string",
    "replay": {
      "gameState": {},
      "moves": []
    }
  }
}
```

### 获取棋谱分析
`GET /api/chess/:id/analysis`

响应：
```json
{
  "success": true,
  "data": [
    {
      "round": 1,
      "analysis": {
        "moveQuality": "good",
        "alternatives": [],
        "evaluation": 0.5
      },
      "keyPoints": ["关键点1"],
      "suggestions": ["建议1"]
    }
  ]
}
```

### 收藏/取消收藏
`POST /api/chess/:id/favorite`

需要认证：是

### 评分
`POST /api/chess/:id/rate`

需要认证：是

请求体：
```json
{
  "score": 5
}
```

### 添加评论
`POST /api/chess/:id/comment`

需要认证：是

请求体：
```json
{
  "content": "string",
  "parentId": "uuid" // 可选，用于回复
}
```

### 获取评论列表
`GET /api/chess/:id/comments`

查询参数：
- `page` (number): 页码
- `limit` (number): 每页数量

---

## 课程接口 (Courses)

### 获取课程列表
`GET /api/courses`

查询参数：
- `page` (number): 页码
- `limit` (number): 每页数量
- `category` (string): 分类
- `difficulty` (string): 难度
- `status` (string): 状态

### 获取课程详情
`GET /api/courses/:id`

### 创建课程
`POST /api/courses`

需要认证：是
权限要求：讲师或管理员

请求体：
```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "difficulty": "BEGINNER",
  "duration": 120,
  "price": 99.99,
  "requirements": ["requirement1"],
  "objectives": ["objective1"]
}
```

### 更新课程
`PUT /api/courses/:id`

需要认证：是
权限要求：课程创建者或管理员

### 删除课程
`DELETE /api/courses/:id`

需要认证：是
权限要求：课程创建者或管理员

### 报名课程
`POST /api/courses/:id/enroll`

需要认证：是

### 获取课程进度
`GET /api/courses/:id/progress`

需要认证：是

### 更新章节进度
`POST /api/courses/lessons/:lessonId/progress`

需要认证：是

请求体：
```json
{
  "progress": 80,
  "completed": false,
  "notes": "学习笔记"
}
```

---

## 安全事件接口 (Security Events)

### 获取事件列表
`GET /api/events`

查询参数：
- `page` (number): 页码
- `limit` (number): 每页数量
- `severity` (string): 严重程度 (LOW|MEDIUM|HIGH|CRITICAL)
- `category` (string): 分类
- `startDate` (string): 开始日期
- `endDate` (string): 结束日期

### 获取事件详情
`GET /api/events/:id`

### 创建事件
`POST /api/events`

需要认证：是
权限要求：管理员

请求体：
```json
{
  "title": "string",
  "description": "string",
  "eventDate": "2024-01-01T00:00:00Z",
  "severity": "HIGH",
  "category": "string",
  "podcastUrl": "string",
  "articleUrl": "string",
  "tags": ["tag1", "tag2"],
  "impact": "string",
  "mitigation": "string"
}
```

### 关联棋谱到事件
`POST /api/events/:id/link-chess`

需要认证：是
权限要求：管理员

请求体：
```json
{
  "chessIds": ["uuid1", "uuid2"]
}
```

### 关联课程到事件
`POST /api/events/:id/link-course`

需要认证：是
权限要求：管理员

请求体：
```json
{
  "courseIds": ["uuid1", "uuid2"]
}
```

---

## 游戏接口 (Game)

### 初始化游戏
`POST /api/game/init`

请求体：
```json
{
  "mode": "single", // single|multi|ai
  "role": "attacker", // attacker|defender|monitor
  "difficulty": "normal" // easy|normal|hard
}
```

响应：
```json
{
  "success": true,
  "data": {
    "sessionId": "string",
    "gameState": {},
    "role": "attacker"
  }
}
```

### 获取游戏状态
`GET /api/game/state/:sessionId`

### 执行游戏动作
`POST /api/game/action`

请求体：
```json
{
  "sessionId": "string",
  "tacticId": "string",
  "targetLayer": "network"
}
```

### 保存游戏记录
`POST /api/game/save`

需要认证：是

请求体：
```json
{
  "sessionId": "string",
  "title": "string",
  "description": "string"
}
```

### 获取游戏历史
`GET /api/game/history`

需要认证：是

查询参数：
- `page` (number): 页码
- `limit` (number): 每页数量

### 获取排行榜
`GET /api/game/leaderboard`

查询参数：
- `period` (string): 时间周期 (daily|weekly|monthly|all)
- `role` (string): 角色筛选

---

## 用户接口 (Users)

### 获取用户资料
`GET /api/users/:id/profile`

### 更新个人资料
`PUT /api/users/profile`

需要认证：是

请求体：
```json
{
  "bio": "string",
  "avatar": "string"
}
```

### 上传头像
`POST /api/users/avatar`

需要认证：是

请求体（multipart/form-data）：
- `file` (file): 图片文件

### 获取通知列表
`GET /api/users/notifications`

需要认证：是

查询参数：
- `page` (number): 页码
- `limit` (number): 每页数量
- `unreadOnly` (boolean): 仅未读

### 标记通知已读
`PUT /api/users/notifications/:id/read`

需要认证：是

---

## 管理后台接口 (Admin)

所有管理接口需要管理员权限

### 获取仪表板数据
`GET /api/admin/dashboard`

响应：
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 1000,
      "totalChess": 500,
      "totalCourses": 50,
      "totalRevenue": 10000
    },
    "charts": {
      "userGrowth": [],
      "activityTrend": [],
      "revenueChart": []
    },
    "recentActivities": []
  }
}
```

### 获取系统分析
`GET /api/admin/analytics`

查询参数：
- `startDate` (string): 开始日期
- `endDate` (string): 结束日期
- `type` (string): 分析类型

### 用户管理
`GET /api/admin/users`

查询参数：
- `page` (number): 页码
- `limit` (number): 每页数量
- `role` (string): 角色筛选
- `status` (string): 状态筛选

### 更新用户角色
`PUT /api/admin/users/:id/role`

请求体：
```json
{
  "role": "INSTRUCTOR"
}
```

### 更新用户状态
`PUT /api/admin/users/:id/status`

请求体：
```json
{
  "isActive": false,
  "reason": "违规行为"
}
```

### 系统设置
`GET /api/admin/settings`
`PUT /api/admin/settings`

---

## WebSocket 事件

### 连接
```javascript
const socket = io('wss://api.cyberchess.com', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### 游戏事件

#### 加入游戏
```javascript
socket.emit('game:join', {
  roomId: 'optional-room-id',
  mode: 'multi'
});
```

#### 游戏动作
```javascript
socket.emit('game:action', {
  roomId: 'room-id',
  action: {
    tacticId: 'apt_recon',
    targetLayer: 'network'
  }
});
```

#### 监听游戏更新
```javascript
socket.on('game:update', (data) => {
  console.log('Game state updated:', data);
});
```

### 聊天事件

#### 加入聊天室
```javascript
socket.emit('chat:join', 'room-id');
```

#### 发送消息
```javascript
socket.emit('chat:message', {
  roomId: 'room-id',
  message: 'Hello!'
});
```

### 通知事件

#### 订阅通知
```javascript
socket.emit('notification:subscribe');
```

#### 接收新通知
```javascript
socket.on('notification:new', (notification) => {
  console.log('New notification:', notification);
});
```

---

## 错误代码

| 代码 | 描述 |
|------|------|
| AUTH001 | 无效的认证凭据 |
| AUTH002 | 令牌已过期 |
| AUTH003 | 无效的令牌 |
| AUTH004 | 未授权访问 |
| AUTH005 | 用户账户已停用 |
| VAL001 | 验证失败 |
| VAL002 | 无效的输入 |
| VAL003 | 缺少必填字段 |
| RES001 | 资源未找到 |
| RES002 | 资源已存在 |
| RES003 | 资源访问被拒绝 |
| GAME001 | 游戏房间已满 |
| GAME002 | 无效的游戏动作 |
| GAME003 | 不是你的回合 |
| GAME004 | 游戏已结束 |
| SYS001 | 内部错误 |
| SYS002 | 数据库错误 |
| SYS003 | 服务不可用 |
| SYS004 | 超出速率限制 |

---

## 速率限制

- 通用端点：100 请求/15分钟
- 认证端点：5 请求/15分钟
- 上传端点：10 请求/小时

超出限制时，API 将返回 429 状态码。

---

## SDK 示例

### JavaScript/TypeScript

```typescript
import axios from 'axios';

class CyberChessAPI {
  private baseURL = 'https://api.cyberchess.com';
  private token: string | null = null;

  async login(username: string, password: string) {
    const response = await axios.post(`${this.baseURL}/api/auth/login`, {
      username,
      password
    });
    this.token = response.data.data.tokens.accessToken;
    return response.data;
  }

  async getChessList(params?: any) {
    return await axios.get(`${this.baseURL}/api/chess`, {
      params,
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    });
  }
}
```

### Python

```python
import requests

class CyberChessAPI:
    def __init__(self):
        self.base_url = 'https://api.cyberchess.com'
        self.token = None
    
    def login(self, username, password):
        response = requests.post(
            f'{self.base_url}/api/auth/login',
            json={'username': username, 'password': password}
        )
        data = response.json()
        self.token = data['data']['tokens']['accessToken']
        return data
    
    def get_chess_list(self, params=None):
        headers = {'Authorization': f'Bearer {self.token}'}
        response = requests.get(
            f'{self.base_url}/api/chess',
            params=params,
            headers=headers
        )
        return response.json()
```