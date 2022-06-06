import { PrismaClient } from "@prisma/client";
import { Service } from "typedi";
import { buildPaginatedResponse } from "../pagination/PaginationHelpers";

@Service()
class UserService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getMany({ take, skip }: { take: number; skip: number }) {
    const [totalCount, items] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        take,
        skip,
      }),
    ]);

    return buildPaginatedResponse(skip, take, items, totalCount);
  }

  async get(id: string) {
    return await this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }
}

export default UserService;
