export function buildPaginatedResponse<T>(
  skip: number,
  take: number,
  items: T[],
  totalCount: number
) {
  return {
    items,
    totalCount,
    hasNextPage: totalCount > skip + take,
    hasPreviousPage: skip > 0,
  };
}
