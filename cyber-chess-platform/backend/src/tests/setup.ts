import { prisma } from '../config/database.config';

beforeAll(async () => {
  // 设置测试数据库
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || 
    'mysql://root:test@localhost:3306/test_db';
});

afterAll(async () => {
  // 清理并断开连接
  await prisma.$disconnect();
});

beforeEach(async () => {
  // MySQL 清理数据库的方式
  const tables = await prisma.$queryRaw<Array<{ TABLE_NAME: string }>>`
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME != '_prisma_migrations'
  `;

  // 禁用外键检查
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

  // 清空所有表
  for (const { TABLE_NAME } of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${TABLE_NAME}\`;`);
  }

  // 重新启用外键检查
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
});