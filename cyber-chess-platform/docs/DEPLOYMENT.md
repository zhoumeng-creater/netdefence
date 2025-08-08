# 网络安全棋谱对抗系统
# Cyber Chess Platform

<div align="center">
[![CI/CD](https:/github.com/zhoumeng-creater/netdefence/cyber-chess-platform/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/your-org/cyber-chess-platform/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

</div>

## 📋 项目简介

网络安全棋谱对抗系统是一个创新的网络安全教育平台，通过游戏化的方式让用户学习和实践网络安全攻防技术。系统集成了：

- 🎮 **多角色对抗游戏** - 扮演攻击者、防守者或监管者
- 📚 **网络安全课程** - 结合实际安全事件的教学内容
- 🏆 **棋谱管理系统** - 记录、分享和分析对战策略
- 💬 **实时对战** - WebSocket支持的多人在线对战
- 📊 **数据分析** - AI驱动的棋谱分析和建议

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- PostgreSQL >= 15.0
- Redis >= 7.0
- Docker & Docker Compose (可选)

### 使用 Docker 部署（推荐）

```bash
# 克隆项目
git clone https://github.com/zhoumeng-creater/netdefence.git
cd cyber-chess-platform

# 配置环境变量
cp docker/.env.example docker/.env
# 编辑 docker/.env 文件配置必要的环境变量

# 构建并启动服务
make docker-up

# 应用将在以下端口运行：
# - 前端: http://localhost:80
# - 后端API: http://localhost:3000
# - MinIO控制台: http://localhost:9001
```

### 本地开发部署

```bash
# 安装依赖
make install

# 配置环境变量
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 初始化数据库
cd backend
npx prisma migrate dev
npx prisma db seed

# 启动开发服务器
make dev

# 或分别启动
npm run dev:backend  # 后端: http://localhost:3000
npm run dev:frontend # 前端: http://localhost:5173
```

## 🏗️ 项目架构

```
cyber-chess-platform/
├── frontend/          # React前端应用
├── backend/           # Node.js后端服务
├── shared/            # 共享类型和工具
├── docker/            # Docker配置文件
├── docs/              # 项目文档
└── scripts/           # 部署和维护脚本
```

### 技术栈

**前端**
- React 18 + TypeScript
- Redux Toolkit (状态管理)
- Ant Design (UI组件库)
- Socket.io Client (WebSocket)
- Vite (构建工具)

**后端**
- Node.js + Express + TypeScript
- Prisma ORM (数据库)
- JWT (认证)
- Socket.io (实时通信)
- Redis (缓存)

**数据库**
- PostgreSQL (主数据库)
- Redis (缓存和会话)
- MinIO (对象存储)

## 🎮 核心功能

### 1. 游戏系统
- 三方对抗机制（攻击者、防守者、监管者）
- 多层防御系统（网络层、应用层、数据层等）
- 资源管理和战术选择
- AI对手和多人对战

### 2. 棋谱管理
- 棋谱上传和分享
- 回放和分析功能
- 评分和评论系统
- 权限分级管理

### 3. 教育平台
- 结构化课程体系
- 安全事件案例库
- 播客和文章集成
- 学习进度追踪

### 4. 用户系统
- 多角色权限（管理员、讲师、用户）
- 个人资料和成就
- 社交功能（关注、评论）
- 通知系统

## 📝 API文档

完整的API文档请查看 [docs/API.md](docs/API.md)

基础端点：
- 认证: `/api/auth`
- 棋谱: `/api/chess`
- 课程: `/api/courses`
- 事件: `/api/events`
- 游戏: `/api/game`
- 管理: `/api/admin`

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行后端测试
npm run test:backend

# 运行前端测试
npm run test:frontend

# 测试覆盖率
npm run test:coverage
```

## 📦 部署

### 生产环境部署

详细部署文档请查看 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

```bash
# 使用部署脚本
./scripts/deploy.sh production

# 或使用 Makefile
make deploy-production
```

### 环境变量配置

关键环境变量：
```env
# 数据库
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# 存储
STORAGE_ENDPOINT=localhost
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
```

## 🔧 开发指南

### 代码规范

```bash
# 代码检查
npm run lint

# 代码格式化
npm run format
```

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码样式
- `refactor:` 重构
- `test:` 测试
- `chore:` 构建/工具

### 分支策略

- `main` - 生产环境
- `develop` - 开发环境
- `feature/*` - 功能开发
- `hotfix/*` - 紧急修复

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Docker](https://www.docker.com/)
- 所有贡献者和支持者

## 📞 联系我们

- 官网: [https://cyberchess.com](https://cyberchess.com)
- Email: support@cyberchess.com
- Issues: [GitHub Issues](https://github.com/your-org/cyber-chess-platform/issues)

---

<div align="center">
  Made with ❤️ by Cyber Chess Team
</div>

# ====================================
# scripts/deploy.sh
#!/bin/bash

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
ENVIRONMENT=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PROJECT_ROOT="/home/deploy/cyber-chess-platform"
BACKUP_DIR="/backups"

# 函数：打印彩色信息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 函数：检查环境
check_environment() {
    if [ -z "$ENVIRONMENT" ]; then
        print_error "Please specify environment: staging or production"
        exit 1
    fi
    
    if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
        print_error "Invalid environment. Use: staging or production"
        exit 1
    fi
    
    print_info "Deploying to $ENVIRONMENT environment"
}

# 函数：创建备份
create_backup() {
    print_info "Creating backup..."
    
    # 备份数据库
    docker-compose -f $PROJECT_ROOT/docker/docker-compose.yml exec -T postgres \
        pg_dump -U postgres cyber_chess_db > $BACKUP_DIR/db_backup_$TIMESTAMP.sql
    
    # 备份上传文件
    tar -czf $BACKUP_DIR/uploads_backup_$TIMESTAMP.tar.gz $PROJECT_ROOT/docker/uploads
    
    print_info "Backup created: $BACKUP_DIR/*_$TIMESTAMP.*"
}

# 函数：拉取最新代码
pull_latest_code() {
    print_info "Pulling latest code..."
    cd $PROJECT_ROOT
    
    if [ "$ENVIRONMENT" == "production" ]; then
        git checkout main
        git pull origin main
    else
        git checkout develop
        git pull origin develop
    fi
    
    print_info "Code updated"
}

# 函数：构建应用
build_application() {
    print_info "Building application..."
    cd $PROJECT_ROOT
    
    # 构建 Docker 镜像
    docker-compose -f docker/docker-compose.yml build
    
    print_info "Build completed"
}

# 函数：运行数据库迁移
run_migrations() {
    print_info "Running database migrations..."
    
    docker-compose -f $PROJECT_ROOT/docker/docker-compose.yml exec backend \
        npx prisma migrate deploy
    
    print_info "Migrations completed"
}

# 函数：部署应用
deploy_application() {
    print_info "Deploying application..."
    cd $PROJECT_ROOT/docker
    
    # 停止旧容器
    docker-compose down
    
    # 启动新容器
    if [ "$ENVIRONMENT" == "production" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    else
        docker-compose up -d
    fi
    
    print_info "Application deployed"
}

# 函数：健康检查
health_check() {
    print_info "Performing health check..."
    sleep 10
    
    # 检查后端
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_info "Backend is healthy"
    else
        print_error "Backend health check failed"
        exit 1
    fi
    
    # 检查前端
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_info "Frontend is healthy"
    else
        print_error "Frontend health check failed"
        exit 1
    fi
    
    print_info "Health check passed"
}

# 函数：清理
cleanup() {
    print_info "Cleaning up..."
    
    # 清理 Docker
    docker system prune -f
    
    # 清理旧备份（保留7天）
    find $BACKUP_DIR -type f -mtime +7 -delete
    
    print_info "Cleanup completed"
}

# 函数：发送通知
send_notification() {
    print_info "Sending deployment notification..."
    
    # 这里可以集成 Slack、邮件等通知服务
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"Deployment to $ENVIRONMENT completed successfully\"}" \
    #     $SLACK_WEBHOOK_URL
    
    print_info "Notification sent"
}

# 主流程
main() {
    print_info "Starting deployment process..."
    
    check_environment
    create_backup
    pull_latest_code
    build_application
    run_migrations
    deploy_application
    health_check
    cleanup
    send_notification
    
    print_info "Deployment completed successfully! 🎉"
}

# 错误处理
trap 'print_error "Deployment failed! Rolling back..."; cd $PROJECT_ROOT/docker && docker-compose up -d; exit 1' ERR

# 执行主流程
main

# ====================================
# scripts/backup.sh
#!/bin/bash

set -e

# 配置
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PROJECT_ROOT="/home/deploy/cyber-chess-platform"
S3_BUCKET="s3://cyberchess-backups"

# 创建备份目录
mkdir -p $BACKUP_DIR

echo "Starting backup at $(date)"

# 1. 备份数据库
echo "Backing up database..."
docker-compose -f $PROJECT_ROOT/docker/docker-compose.yml exec -T postgres \
    pg_dump -U postgres cyber_chess_db | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# 2. 备份上传文件
echo "Backing up uploaded files..."
tar -czf $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz -C $PROJECT_ROOT/docker uploads

# 3. 备份配置文件
echo "Backing up configuration..."
tar -czf $BACKUP_DIR/config_$TIMESTAMP.tar.gz \
    $PROJECT_ROOT/docker/.env \
    $PROJECT_ROOT/backend/.env \
    $PROJECT_ROOT/frontend/.env

# 4. 上传到云存储（如果配置了）
if command -v aws &> /dev/null; then
    echo "Uploading to S3..."
    aws s3 cp $BACKUP_DIR/db_$TIMESTAMP.sql.gz $S3_BUCKET/
    aws s3 cp $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz $S3_BUCKET/
    aws s3 cp $BACKUP_DIR/config_$TIMESTAMP.tar.gz $S3_BUCKET/
fi

# 5. 清理旧备份（保留7天）
echo "Cleaning old backups..."
find $BACKUP_DIR -type f -mtime +7 -delete

# 6. 显示备份大小
echo "Backup completed. Size:"
du -sh $BACKUP_DIR/*$TIMESTAMP*

echo "Backup finished at $(date)"

# ====================================
# scripts/restore.sh
#!/bin/bash

set -e

# 配置
BACKUP_FILE=$1
PROJECT_ROOT="/home/deploy/cyber-chess-platform"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore.sh <backup_file>"
    echo "Example: ./restore.sh /backups/db_20240101_120000.sql.gz"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Starting restore from $BACKUP_FILE"

# 1. 停止应用
echo "Stopping application..."
cd $PROJECT_ROOT/docker
docker-compose stop backend

# 2. 恢复数据库
if [[ $BACKUP_FILE == *.sql.gz ]]; then
    echo "Restoring database..."
    gunzip -c $BACKUP_FILE | docker-compose exec -T postgres psql -U postgres cyber_chess_db
elif [[ $BACKUP_FILE == *uploads*.tar.gz ]]; then
    echo "Restoring uploaded files..."
    tar -xzf $BACKUP_FILE -C $PROJECT_ROOT/docker
elif [[ $BACKUP_FILE == *config*.tar.gz ]]; then
    echo "Restoring configuration..."
    tar -xzf $BACKUP_FILE -C /
fi

# 3. 重启应用
echo "Starting application..."
docker-compose up -d

# 4. 健康检查
echo "Performing health check..."
sleep 10
curl -f http://localhost:3000/health || exit 1

echo "Restore completed successfully!"

# ====================================
# scripts/create-admin.js
#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdmin() {
  try {
    console.log('Creating admin user...\n');
    
    const username = await question('Username: ') || 'admin';
    const email = await question('Email: ') || 'admin@cyberchess.com';
    const password = await question('Password: ') || 'Admin@123456';
    
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }]
      }
    });
    
    if (existingUser) {
      console.log('\nUser already exists!');
      process.exit(1);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        emailVerified: true,
        isActive: true
      }
    });
    
    console.log('\n✅ Admin user created successfully!');
    console.log(`Username: ${admin.username}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);

  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

createAdmin();