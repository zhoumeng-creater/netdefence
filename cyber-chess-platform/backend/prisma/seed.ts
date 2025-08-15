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
      isActive: true,  // 添加isActive字段
    },
  });

  console.log('✅ 管理员用户创建成功:', admin.username);

  // 创建演示用户
  const demoPassword = await bcrypt.hash('demo123', 10);
  
  const demoUser = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      email: 'demo@cyberchess.com',
      password: demoPassword,
      role: 'USER',
      emailVerified: true,
      isActive: true,
    },
  });

  console.log('✅ 演示用户创建成功:', demoUser.username);

  // 创建测试用户
  const testPassword = await bcrypt.hash('Test@123456', 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@cyberchess.com' },
    update: {},
    create: {
      username: 'testuser',
      email: 'test@cyberchess.com',
      password: testPassword,
      role: 'USER',
      emailVerified: true,
      isActive: true,
    },
  });

  console.log('✅ 测试用户创建成功:', testUser.username);

  // 创建讲师用户
  const instructorPassword = await bcrypt.hash('Instructor@123', 10);
  
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@cyberchess.com' },
    update: {},
    create: {
      username: 'instructor',
      email: 'instructor@cyberchess.com',
      password: instructorPassword,
      role: 'INSTRUCTOR',
      emailVerified: true,
      isActive: true,
    },
  });

  console.log('✅ 讲师用户创建成功:', instructor.username);

  console.log('🎉 所有种子数据初始化完成！');
  console.log('----------------------------');
  console.log('可用账号：');
  console.log('管理员 - admin / Admin@123456');
  console.log('演示用户 - demo / demo123');
  console.log('测试用户 - testuser / Test@123456');
  console.log('讲师 - instructor / Instructor@123');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });