"""
用户管理路由
处理用户相关的API端点
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.user_models import User, UserRole
from app.auth import (
    get_current_user,
    get_current_active_user,
    get_admin_user,
    get_password_hash
)
from pydantic import BaseModel, EmailStr

# 创建路由器
router = APIRouter()

# Pydantic模型
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    level: int
    experience: int
    games_played: int
    games_won: int
    total_score: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    email: Optional[EmailStr] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class UserStatsResponse(BaseModel):
    games_played: int
    games_won: int
    win_rate: float
    total_score: int
    level: int
    experience: int
    rank: Optional[int] = None

# ========== 用户信息端点 ==========

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """获取当前用户详细信息"""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role.value,
        nickname=current_user.nickname,
        avatar=current_user.avatar,
        bio=current_user.bio,
        level=current_user.level,
        experience=current_user.experience,
        games_played=current_user.games_played,
        games_won=current_user.games_won,
        total_score=current_user.total_score,
        created_at=current_user.created_at
    )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db)
):
    """根据ID获取用户信息"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role.value,
        nickname=user.nickname,
        avatar=user.avatar,
        bio=user.bio,
        level=user.level,
        experience=user.experience,
        games_played=user.games_played,
        games_won=user.games_won,
        total_score=user.total_score,
        created_at=user.created_at
    )

@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)  # 仅管理员可访问
):
    """获取用户列表（管理员）"""
    query = db.query(User)
    
    # 搜索过滤
    if search:
        query = query.filter(
            (User.username.contains(search)) |
            (User.email.contains(search)) |
            (User.nickname.contains(search))
        )
    
    # 角色过滤
    if role:
        try:
            role_enum = UserRole[role.upper()]
            query = query.filter(User.role == role_enum)
        except KeyError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role: {role}"
            )
    
    # 分页
    users = query.offset(skip).limit(limit).all()
    
    return [
        UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role.value,
            nickname=user.nickname,
            avatar=user.avatar,
            bio=user.bio,
            level=user.level,
            experience=user.experience,
            games_played=user.games_played,
            games_won=user.games_won,
            total_score=user.total_score,
            created_at=user.created_at
        )
        for user in users
    ]

# ========== 用户更新端点 ==========

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新当前用户信息"""
    # 更新字段
    if user_update.nickname is not None:
        current_user.nickname = user_update.nickname
    if user_update.bio is not None:
        current_user.bio = user_update.bio
    if user_update.avatar is not None:
        current_user.avatar = user_update.avatar
    if user_update.email is not None:
        # 检查邮箱是否已被使用
        existing_user = db.query(User).filter(
            User.email == user_update.email,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        current_user.email = user_update.email
    
    current_user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role.value,
        nickname=current_user.nickname,
        avatar=current_user.avatar,
        bio=current_user.bio,
        level=current_user.level,
        experience=current_user.experience,
        games_played=current_user.games_played,
        games_won=current_user.games_won,
        total_score=current_user.total_score,
        created_at=current_user.created_at
    )

@router.post("/me/password")
async def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """修改密码"""
    from app.auth import verify_password
    
    # 验证旧密码
    if not verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    # 设置新密码
    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Password changed successfully"}

# ========== 用户统计端点 ==========

@router.get("/me/stats", response_model=UserStatsResponse)
async def get_user_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取用户游戏统计"""
    win_rate = 0.0
    if current_user.games_played > 0:
        win_rate = (current_user.games_won / current_user.games_played) * 100
    
    # 计算排名（基于总分）
    rank = db.query(User).filter(
        User.total_score > current_user.total_score
    ).count() + 1
    
    return UserStatsResponse(
        games_played=current_user.games_played,
        games_won=current_user.games_won,
        win_rate=win_rate,
        total_score=current_user.total_score,
        level=current_user.level,
        experience=current_user.experience,
        rank=rank
    )

@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """获取排行榜"""
    top_users = db.query(User).order_by(
        User.total_score.desc()
    ).limit(limit).all()
    
    leaderboard = []
    for rank, user in enumerate(top_users, 1):
        win_rate = 0.0
        if user.games_played > 0:
            win_rate = (user.games_won / user.games_played) * 100
        
        leaderboard.append({
            "rank": rank,
            "user_id": user.id,
            "username": user.username,
            "nickname": user.nickname or user.username,
            "avatar": user.avatar,
            "level": user.level,
            "total_score": user.total_score,
            "games_played": user.games_played,
            "games_won": user.games_won,
            "win_rate": win_rate
        })
    
    return {"leaderboard": leaderboard}

# ========== 管理员端点 ==========

@router.put("/{user_id}/role")
async def update_user_role(
    user_id: int,
    new_role: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """更新用户角色（管理员）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # 验证角色
    try:
        role_enum = UserRole[new_role.upper()]
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role: {new_role}"
        )
    
    # 不能修改超级管理员角色
    if user.role == UserRole.SUPER_ADMIN and admin_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify super admin role"
        )
    
    user.role = role_enum
    user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": f"User role updated to {new_role}"}

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """删除用户（管理员）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # 不能删除超级管理员
    if user.role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete super admin"
        )
    
    # 不能删除自己
    if user.id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

@router.put("/{user_id}/status")
async def toggle_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """启用/禁用用户（管理员）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # 不能禁用超级管理员
    if user.role == UserRole.SUPER_ADMIN and not is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot disable super admin"
        )
    
    # 不能禁用自己
    if user.id == admin_user.id and not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot disable yourself"
        )
    
    user.is_active = is_active
    user.updated_at = datetime.utcnow()
    
    db.commit()
    
    status_text = "enabled" if is_active else "disabled"
    return {"message": f"User {status_text} successfully"}