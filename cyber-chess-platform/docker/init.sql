# docker/init.sql
-- Initialize database with required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON "User"(username);
CREATE INDEX IF NOT EXISTS idx_chess_author ON "ChessRecord"("authorId");
CREATE INDEX IF NOT EXISTS idx_chess_type ON "ChessRecord"(type);
CREATE INDEX IF NOT EXISTS idx_course_instructor ON "Course"("instructorId");
CREATE INDEX IF NOT EXISTS idx_session_token ON "Session"(token);
CREATE INDEX IF NOT EXISTS idx_session_user ON "Session"("userId");

-- Create initial admin user (password: Admin@123456)
INSERT INTO "User" (id, username, email, password, role, "emailVerified", "isActive", "createdAt", "updatedAt")
VALUES (
    uuid_generate_v4(),
    'admin',
    'admin@cyberchess.com',
    '$2a$10$YourHashedPasswordHere',
    'SUPER_ADMIN',
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;