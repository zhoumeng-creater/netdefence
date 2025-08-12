// src/utils/pagination.ts
interface PaginationParams {
  page: number;
  limit: number;
}

interface PaginationResult<T> {
  data: T[];
  meta: {  // 使用 meta 替代 pagination
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 通用分页函数
 * @param model Prisma 模型
 * @param params 分页参数
 * @param where 查询条件
 * @param options 额外的 Prisma 查询选项
 * @returns 分页结果
 */
export async function paginate<T>(
  model: any,
  { page, limit }: PaginationParams,
  where: any = {},
  options: any = {}
): Promise<PaginationResult<T>> {
  const skip = (page - 1) * limit;
  const take = limit;

  const [data, total] = await Promise.all([
    model.findMany({
      where,
      skip,
      take,
      ...options
    }),
    model.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data,
    meta: {  // 返回 meta 而不是 pagination
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev
    }
  };
}