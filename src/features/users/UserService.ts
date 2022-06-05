import { PrismaClient } from "@prisma/client";
import { Service } from "typedi";

@Service()
class UserService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getAll({ take, skip }: { take: number; skip: number }) {
    return await this.prisma.user.findMany({
      take,
      skip,
    });
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
