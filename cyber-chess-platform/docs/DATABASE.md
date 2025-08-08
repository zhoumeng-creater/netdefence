# Database Design Documentation

## 数据库架构设计文档

### 概述

网络安全棋谱对抗系统采用 PostgreSQL 作为主数据库，Redis 作为缓存层，MinIO 作为对象存储。

### 数据库架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         应用层                               │
├─────────────────────────────────────────────────────────────┤
│                      Prisma ORM                              │
├─────────────────────────────────────────────────────────────┤
│        PostgreSQL          │    Redis    │      MinIO        │
│      (主数据存储)          │  (缓存层)   │   (文件存储)     │
└─────────────────────────────────────────────────────────────┘
```

### 核心数据表设计

#### 1. 用户相关表

**User（用户表）**
```sql
CREATE TABLE "User" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    avatar TEXT,
    bio TEXT,
    isActive BOOLEAN DEFAULT true,
    emailVerified BOOLEAN DEFAULT false,
    lastLogin TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_username ON "User"(username);
CREATE INDEX idx_user_role ON "User"(role);
```

**Session（会话表）**
```sql
CREATE TABLE "Session" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    refreshToken TEXT UNIQUE NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (userId) REFERENCES "User"(id)
);

-- 索引
CREATE INDEX idx_session_token ON "Session"(token);
CREATE INDEX idx_session_user ON "Session"(userId);
```

#### 2. 棋谱相关表

**ChessRecord（棋谱记录表）**
```sql
CREATE TABLE "ChessRecord" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL,
    content JSONB NOT NULL,
    thumbnail TEXT,
    visibility VARCHAR(20) DEFAULT 'PUBLIC',
    tags TEXT[],
    rating DECIMAL(2,1) DEFAULT 0,
    playCount INTEGER DEFAULT 0,
    duration INTEGER,
    difficulty VARCHAR(20),
    authorId UUID NOT NULL REFERENCES "User"(id),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_chess_author ON "ChessRecord"(authorId);
CREATE INDEX idx_chess_type ON "ChessRecord"(type);
CREATE INDEX idx_chess_visibility ON "ChessRecord"(visibility);
CREATE INDEX idx_chess_tags ON "ChessRecord" USING GIN(tags);
```

**ChessAnalysis（棋谱分析表）**
```sql
CREATE TABLE "ChessAnalysis" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chessId UUID NOT NULL REFERENCES "ChessRecord"(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    analysis JSONB NOT NULL,
    keyPoints TEXT[],
    suggestions TEXT[],
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_analysis_chess ON "ChessAnalysis"(chessId);
```

#### 3. 课程相关表

**Course（课程表）**
```sql
CREATE TABLE "Course" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    thumbnail TEXT,
    instructorId UUID NOT NULL REFERENCES "User"(id),
    difficulty VARCHAR(20) NOT NULL,
    duration INTEGER NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'DRAFT',
    syllabus JSONB,
    requirements TEXT[],
    objectives TEXT[],
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_course_instructor ON "Course"(instructorId);
CREATE INDEX idx_course_category ON "Course"(category);
CREATE INDEX idx_course_status ON "Course"(status);
```

**Lesson（课程章节表）**
```sql
CREATE TABLE "Lesson" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    courseId UUID NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    videoUrl TEXT,
    materials JSONB,
    orderIndex INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_lesson_course ON "Lesson"(courseId);
CREATE INDEX idx_lesson_order ON "Lesson"(courseId, orderIndex);
```

#### 4. 安全事件表

**SecurityEvent（安全事件表）**
```sql
CREATE TABLE "SecurityEvent" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    eventDate TIMESTAMP NOT NULL,
    severity VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    podcastUrl TEXT,
    articleUrl TEXT,
    videoUrl TEXT,
    tags TEXT[],
    impact TEXT,
    mitigation TEXT,
    references JSONB,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_event_severity ON "SecurityEvent"(severity);
CREATE INDEX idx_event_date ON "SecurityEvent"(eventDate);
CREATE INDEX idx_event_category ON "SecurityEvent"(category);
```

#### 5. 关联表

**Enrollment（课程注册表）**
```sql
CREATE TABLE "Enrollment" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID NOT NULL REFERENCES "User"(id),
    courseId UUID NOT NULL REFERENCES "Course"(id),
    enrolledAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completedAt TIMESTAMP,
    progress DECIMAL(5,2) DEFAULT 0,
    certificate TEXT,
    
    UNIQUE(userId, courseId)
);
```

**Rating（评分表）**
```sql
CREATE TABLE "Rating" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    userId UUID NOT NULL REFERENCES "User"(id),
    chessId UUID NOT NULL REFERENCES "ChessRecord"(id) ON DELETE CASCADE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(userId, chessId)
);
```

### 数据库优化策略

#### 1. 索引优化
- 为所有外键创建索引
- 为常用查询字段创建索引
- 使用 GIN 索引优化数组和 JSONB 查询

#### 2. 查询优化
```sql
-- 使用 EXPLAIN ANALYZE 分析查询性能
EXPLAIN ANALYZE SELECT * FROM "ChessRecord" 
WHERE type = 'OFFICIAL' AND visibility = 'PUBLIC'
ORDER BY createdAt DESC LIMIT 10;

-- 创建复合索引
CREATE INDEX idx_chess_type_visibility_created 
ON "ChessRecord"(type, visibility, createdAt DESC);
```

#### 3. 分区策略
```sql
-- 对大表进行分区（如游戏记录表）
CREATE TABLE "GameRecord" (
    id UUID,
    userId UUID,
    createdAt TIMESTAMP,
    ...
) PARTITION BY RANGE (createdAt);

-- 创建月度分区
CREATE TABLE game_record_2024_01 
PARTITION OF "GameRecord" 
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

#### 4. 缓存策略

**Redis 缓存键设计**
```
user:{userId}                     # 用户信息
session:{token}                   # 会话信息
chess:{chessId}                   # 棋谱详情
chess:list:{page}:{filters}       # 棋谱列表
course:{courseId}                 # 课程详情
leaderboard:{period}              # 排行榜
notifications:{userId}            # 用户通知
```

### 数据备份策略

#### 1. 自动备份脚本
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="cyber_chess_db"

# 执行备份
pg_dump -h localhost -U postgres $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -type f -mtime +7 -delete

# 上传到云存储（可选）
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://backups/
```

#### 2. 恢复流程
```bash
# 恢复数据库
gunzip backup_20240101_000000.sql.gz
psql -h localhost -U postgres cyber_chess_db < backup_20240101_000000.sql
```

### 监控指标

#### 关键性能指标
- 查询响应时间 < 100ms
- 数据库连接数 < 100
- 缓存命中率 > 80%
- 索引使用率 > 90%

#### 监控查询
```sql
-- 查看慢查询
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;

-- 查看表大小
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 查看索引使用情况
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

---

# Deployment Documentation

## 部署文档

### 部署架构

```
┌──────────────────────────────────────────────────────────┐
│                    Load Balancer (Nginx)                  │
├──────────────────────────────────────────────────────────┤
│                                                            │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│   │  Frontend  │  │  Frontend  │  │  Frontend  │        │
│   │  (React)   │  │  (React)   │  │  (React)   │        │
│   └────────────┘  └────────────┘  └────────────┘        │
│                                                            │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│   │  Backend   │  │  Backend   │  │  Backend   │        │
│   │  (Node.js) │  │  (Node.js) │  │  (Node.js) │        │
│   └────────────┘  └────────────┘  └────────────┘        │
│                                                            │
├──────────────────────────────────────────────────────────┤
│         PostgreSQL      │    Redis    │     MinIO         │
└──────────────────────────────────────────────────────────┘
```

### 环境要求

#### 硬件要求

**最小配置**
- CPU: 2 核心
- 内存: 4 GB
- 存储: 50 GB SSD
- 带宽: 10 Mbps

**推荐配置**
- CPU: 4 核心
- 内存: 8 GB
- 存储: 100 GB SSD
- 带宽: 100 Mbps

#### 软件要求
- 操作系统: Ubuntu 22.04 LTS / CentOS 8
- Docker: 24.0+
- Docker Compose: 2.20+
- Node.js: 18.x (如果不使用 Docker)
- PostgreSQL: 15.x
- Redis: 7.x
- Nginx: 1.24+

### 部署步骤

#### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y git curl wget vim

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 创建部署用户
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy
```

#### 2. 克隆项目

```bash
# 切换到部署用户
sudo su - deploy

# 克隆项目
git clone https://github.com/your-org/cyber-chess-platform.git
cd cyber-chess-platform
```

#### 3. 配置环境变量

```bash
# 复制环境变量模板
cp docker/.env.example docker/.env

# 编辑环境变量
vim docker/.env

# 必须配置的变量：
# - DB_PASSWORD
# - JWT_SECRET
# - JWT_REFRESH_SECRET
# - STORAGE_ACCESS_KEY
# - STORAGE_SECRET_KEY
```

#### 4. 使用 Docker Compose 部署

```bash
# 进入 docker 目录
cd docker

# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 5. 初始化数据库

```bash
# 运行数据库迁移
docker-compose exec backend npx prisma migrate deploy

# 创建管理员账户
docker-compose exec backend node scripts/create-admin.js
```

#### 6. 配置 Nginx 反向代理

```nginx
# /etc/nginx/sites-available/cyberchess
server {
    listen 80;
    server_name cyberchess.com www.cyberchess.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cyberchess.com www.cyberchess.com;
    
    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/cyberchess.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cyberchess.com/privkey.pem;
    
    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 代理到 Docker 容器
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket 支持
    location /socket.io {
        proxy_pass http://localhost:3000/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### 7. SSL 证书配置

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d cyberchess.com -d www.cyberchess.com

# 自动续期
sudo certbot renew --dry-run
```

### 生产环境优化

#### 1. 数据库优化

```sql
-- postgresql.conf 优化配置
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 4
max_parallel_workers_per_gather = 2
max_parallel_workers = 4
```

#### 2. Redis 优化

```conf
# redis.conf 优化配置
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
```

#### 3. Node.js 优化

```javascript
// PM2 配置 ecosystem.config.js
module.exports = {
  apps: [{
    name: 'cyber-chess-backend',
    script: './dist/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 监控和维护

#### 1. 健康检查

```bash
# 检查服务健康状态
curl http://localhost:3000/health
curl http://localhost/health

# 检查数据库连接
docker-compose exec postgres pg_isready

# 检查 Redis 连接
docker-compose exec redis redis-cli ping
```

#### 2. 日志管理

```bash
# 查看应用日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 日志轮转配置
cat > /etc/logrotate.d/cyberchess << EOF
/var/log/cyberchess/*.log {
    daily
    rotate 14
    compress
    missingok
    notifempty
    create 640 deploy deploy
    sharedscripts
    postrotate
        docker-compose restart backend
    endscript
}
EOF
```

#### 3. 备份策略

```bash
# 创建备份脚本
cat > /home/deploy/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# 备份数据库
docker-compose exec -T postgres pg_dump -U postgres cyber_chess_db > $BACKUP_DIR/db_$DATE.sql

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /home/deploy/cyber-chess-platform/docker/uploads

# 上传到云存储
aws s3 sync $BACKUP_DIR s3://cyberchess-backups/

# 清理旧备份
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

# 添加到 crontab
crontab -e
# 0 2 * * * /home/deploy/backup.sh
```

#### 4. 监控告警

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
      
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      
  node-exporter:
    image: prom/node-exporter
    ports:
      - "9100:9100"
```

### 故障排查

#### 常见问题

**1. Docker 容器无法启动**
```bash
# 查看容器日志
docker-compose logs backend

# 检查端口占用
sudo netstat -tulpn | grep :3000

# 重启容器
docker-compose restart backend
```

**2. 数据库连接失败**
```bash
# 检查数据库状态
docker-compose exec postgres psql -U postgres -c "SELECT 1"

# 检查连接字符串
docker-compose exec backend env | grep DATABASE_URL
```

**3. 文件上传失败**
```bash
# 检查权限
ls -la docker/uploads

# 修复权限
sudo chown -R 1001:1001 docker/uploads
```

### 扩展部署

#### Kubernetes 部署

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cyber-chess-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: cyberchess/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 性能测试

```bash
# 使用 Apache Bench 进行压力测试
ab -n 1000 -c 100 http://localhost:3000/api/chess

# 使用 k6 进行负载测试
k6 run load-test.js
```

### 安全加固

1. **防火墙配置**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **定期更新**
```bash
# 系统更新
sudo apt update && sudo apt upgrade

# Docker 镜像更新
docker-compose pull
docker-compose up -d
```

3. **安全扫描**
```bash
# 扫描 Docker 镜像漏洞
docker scan cyberchess/backend:latest
```