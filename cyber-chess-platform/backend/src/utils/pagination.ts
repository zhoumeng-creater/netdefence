// src/utils/pagination.ts
export async function paginate(
  model: any,
  options: {
    page?: number;
    limit?: number;
    sort?: any;
  },
  where?: any,
  include?: any
) {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.findMany({
      where,
      include,
      skip,
      take: limit,
      orderBy: options.sort || { createdAt: 'desc' }
    }),
    model.count({ where })
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}