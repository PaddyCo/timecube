import { PrismaClient, Time } from "@prisma/client";
import { formatError, GraphQLError } from "graphql";
import { Service } from "typedi";
import { BatchPostTimeInput, PostTimeInput } from "./TimeResolver";
import PuzzleTypeService from "../puzzleTypes/PuzzleTypeService";
import UserService from "../users/UserService";

interface GetAllParams {
  userId?: string;
  puzzleTypeSlug?: string;
  take?: number;
  skip?: number;
}

@Service()
class TimeService {
  private prisma: PrismaClient;
  private userService: UserService;
  private puzzleTypeService: PuzzleTypeService;

  constructor(
    prisma: PrismaClient,
    userService: UserService,
    puzzleTypeService: PuzzleTypeService
  ) {
    this.prisma = prisma;
    this.userService = userService;
    this.puzzleTypeService = puzzleTypeService;
  }

  async getAll({ userId, puzzleTypeSlug, take, skip }: GetAllParams) {
    take = take ?? 10;
    skip = skip ?? 0;

    const times = await this.prisma.time.findMany({
      take: take + 99, // Enough to calculate averages!
      skip,
      orderBy: [{ performedAt: "desc" }],
      where: {
        userId,
        puzzleTypeSlug,
      },
    });

    return times
      .map((t, i) => {
        return {
          ...t,
          ao5: this.calculateAverage(i, times, 5),
          ao12: this.calculateAverage(i, times, 12),
          ao100: this.calculateAverage(i, times, 100),
        };
      })
      .slice(0, take);
  }

  async create(input: PostTimeInput) {
    const [user, puzzleType] = await Promise.all([
      this.userService.get(input.userId),
      this.puzzleTypeService.get(input.puzzleTypeSlug),
    ]);

    if (!user) {
      throw new GraphQLError("User was not found");
    }

    if (!puzzleType) {
      throw new GraphQLError("Puzzle Type was not found");
    }

    return await this.prisma.time.create({
      data: input,
    });
  }

  async batchCreate(input: BatchPostTimeInput) {
    const [user, puzzleType] = await Promise.all([
      this.userService.get(input.userId),
      this.puzzleTypeService.get(input.puzzleTypeSlug),
    ]);

    if (!user) {
      throw new GraphQLError("User was not found");
    }

    if (!puzzleType) {
      throw new GraphQLError("Puzzle Type was not found");
    }

    return await this.prisma.time.createMany({
      data: input.data.map((t) => ({
        userId: input.userId,
        puzzleTypeSlug: input.puzzleTypeSlug,
        ...t,
      })),
    });
  }

  calculateAverage(timeIndex: number, allTimes: Time[], count: number) {
    const times = allTimes.slice(timeIndex, timeIndex + count);
    const dnfCount = times.filter((t) => t.dnf).length;
    const removeCount = Math.ceil(count * 0.05);

    if (times.length != count || dnfCount > removeCount) {
      return null;
    }

    const totalMs = times
      .sort((a, b) => a.milliseconds - b.milliseconds)
      .sort((a, b) => (b.dnf ? -1000000 : 0))
      .map((t) => t.milliseconds)
      .slice(removeCount, count - removeCount)
      .reduce((a, b) => a + b);

    return Math.round(totalMs / (count - removeCount * 2));
  }
}

export default TimeService;
