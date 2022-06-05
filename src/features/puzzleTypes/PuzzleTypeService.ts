import { PrismaClient } from "@prisma/client";
import { Service } from "typedi";

@Service()
class PuzzleTypeService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getAll(take: number, skip: number) {
    return await this.prisma.puzzleType.findMany({
      take,
      skip,
    });
  }

  async get(slug: string) {
    return await this.prisma.puzzleType.findUnique({
      where: {
        slug,
      },
    });
  }
}

export default PuzzleTypeService;
