import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始数据库种子数据初始化...');

  // 创建管理员用户
  const adminPassword = await bcrypt.hash('Admin@123456', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cyberchess.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@cyberchess.com',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      emailVerified: true,
    },
  });

  console.log('✅ 管理员用户创建成功:', admin.username);

  // 创建测试数据...
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });