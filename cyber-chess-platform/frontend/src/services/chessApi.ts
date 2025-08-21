// frontend/src/services/chessApi.ts
import { request } from '@/utils/request';
import type { ChessRecord, GameMove } from '@/types/chess.types';

export const chessApi = {
  // 获取棋谱列表
  getList: (params?: any) => 
    request.get<{ data: ChessRecord[]; total: number }>('/api/chess', { params }),

  // 获取棋谱详情
  getDetail: (id: string) =>
    request.get<ChessRecord>(`/api/chess/${id}`),

  // 获取回放数据
  getChessReplay: (id: string) =>
    request.get<{
      chess: ChessRecord;
      moves: GameMove[];
      states: any[];
    }>(`/api/chess/${id}/replay`),

  // 获取分析数据
  getChessAnalysis: (id: string) =>
    request.get<any>(`/api/chess/${id}/analysis`),

  // 上传棋谱
  upload: (data: FormData) =>
    request.post<{ id: string }>('/api/chess/upload', data),

  // 删除棋谱
  delete: (id: string) =>
    request.delete(`/api/chess/${id}`),
};