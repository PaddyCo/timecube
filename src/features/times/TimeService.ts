import { PrismaClient, Time, Prisma, UserBest } from "@prisma/client";
import { formatError, GraphQLError } from "graphql";
import { Service } from "typedi";
import { BatchPostTimeInput, PostTimeInput } from "./TimeResolver";
import PuzzleTypeService from "../puzzleTypes/PuzzleTypeService";
import UserService from "../users/UserService";
import { buildPaginatedResponse } from "../pagination/PaginationHelpers";
import { PaginationArgs } from "../pagination/PaginationSchema";
import { time } from "console";

interface GetManyParams extends PaginationArgs {
  userId?: string;
  puzzleTypeSlug?: string;
}

const orderBy: Prisma.TimeOrderByWithRelationInput[] = [
  { performedAt: "desc" },
  { createdAt: "desc" },
];

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

  async getMany({ userId, puzzleTypeSlug, take, skip }: GetManyParams) {
    take = take ?? 10;
    skip = skip ?? 0;

    const where = {
      userId,
      puzzleTypeSlug,
    };

    const [totalCount, times] = await this.prisma.$transaction([
      this.prisma.time.count({
        where,
      }),
      this.prisma.time.findMany({
        take: take + 99, // Enough to calculate averages!
        skip,
        orderBy,
        where,
      }),
    ]);

    const items = times
      .map((t, i) => {
        return {
          ...t,
          ao5: this.calculateAverage(i, times, 5),
          ao12: this.calculateAverage(i, times, 12),
          ao100: this.calculateAverage(i, times, 100),
        };
      })
      .slice(0, take);

    return buildPaginatedResponse(skip, take, items, totalCount);
  }

  async updateBests(userId: string, puzzleTypeSlug: string) {
    const user = await this.userService.get(userId);

    if (!user) {
      throw new GraphQLError("User was not found");
    }

    const times = await this.prisma.time.findMany({
      where: {
        userId,
        puzzleTypeSlug,
      },
      orderBy,
    });

    const timesReversed = times.slice().reverse();

    let bestSingleMs: number | null = null;
    let bestAo5Ms: number | null = null;
    let bestAo12Ms: number | null = null;
    let bestAo100Ms: number | null = null;

    const bests: UserBest[] = [];

    timesReversed.forEach((time, i) => {
      const ao5 = this.calculateAverage(times.length - (i + 1), times, 5);
      const ao12 = this.calculateAverage(times.length - (i + 1), times, 12);
      const ao100 = this.calculateAverage(times.length - (i + 1), times, 100);

      if (
        bestSingleMs == null ||
        (time.milliseconds < bestSingleMs && !time.dnf)
      ) {
        bestSingleMs = time.milliseconds;
        bests.push({
          category: "SINGLE",
          timeId: time.id,
          userId,
          milliseconds: time.milliseconds,
        });
      }

      if (ao5 !== null) {
        if (bestAo5Ms == null || ao5 < bestAo5Ms) {
          bestAo5Ms = ao5;
          bests.push({
            category: "AO5",
            timeId: time.id,
            userId,
            milliseconds: ao5,
          });
        }
      }

      if (ao12 !== null) {
        if (bestAo12Ms == null || ao12 < bestAo12Ms) {
          bestAo12Ms = ao12;
          bests.push({
            category: "AO12",
            timeId: time.id,
            userId,
            milliseconds: ao12,
          });
        }
      }

      if (ao100 !== null) {
        if (bestAo100Ms == null || ao100 < bestAo100Ms) {
          bestAo100Ms = ao100;
          bests.push({
            category: "AO100",
            timeId: time.id,
            userId,
            milliseconds: ao100,
          });
        }
      }
    });

    // Remove old bests
    await this.prisma.userBest.deleteMany({
      where: {
        time: {
          userId,
          puzzleTypeSlug,
        },
      },
    });

    const updatedBests = await this.prisma.userBest.createMany({
      data: bests,
    });

    return updatedBests;
  }

  async getBests(userId: string, puzzleTypeSlug: string) {
    const where = {
      userId,
      time: {
        puzzleTypeSlug,
      },
    };

    const timeOrderBy: Prisma.UserBestOrderByWithRelationInput[] = [
      { time: orderBy[0] },
      { time: orderBy[1] },
    ];

    const include = {
      time: true,
    };

    const single = await this.prisma.userBest.findFirst({
      include,
      orderBy: timeOrderBy,
      where: {
        ...where,
        category: "SINGLE",
      },
    });

    const ao5 = await this.prisma.userBest.findFirst({
      include,
      orderBy: timeOrderBy,
      where: {
        ...where,
        category: "AO5",
      },
    });

    const ao12 = await this.prisma.userBest.findFirst({
      include,
      orderBy: timeOrderBy,
      where: {
        ...where,
        category: "AO12",
      },
    });

    const ao100 = await this.prisma.userBest.findFirst({
      include,
      orderBy: timeOrderBy,
      where: {
        ...where,
        category: "AO100",
      },
    });

    return {
      single: single?.time,
      ao5: ao5
        ? {
            ...ao5?.time,
            ao5: ao5?.milliseconds,
          }
        : null,
      ao12: ao12
        ? {
            ...ao12?.time,
            ao12: ao12?.milliseconds,
          }
        : null,
      ao100: ao100
        ? {
            ...ao100?.time,
            ao100: ao100?.milliseconds,
          }
        : null,
    };
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

    const newTime = await this.prisma.time.create({
      data: input,
    });

    const timesBeforeNew = await this.prisma.time.findMany({
      where: {
        userId: newTime.userId,
        puzzleTypeSlug: newTime.puzzleTypeSlug,
        performedAt: {
          lt: newTime.performedAt,
        },
      },
      orderBy,
      take: 99,
    });

    await this.updateBests(input.userId, input.puzzleTypeSlug);

    return {
      ...newTime,
      ao5: this.calculateAverage(0, [newTime, ...timesBeforeNew], 5),
      ao12: this.calculateAverage(0, [newTime, ...timesBeforeNew], 12),
      ao100: this.calculateAverage(0, [newTime, ...timesBeforeNew], 100),
    };
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

    const data = await this.prisma.time.createMany({
      data: input.data.map((t) => ({
        userId: input.userId,
        puzzleTypeSlug: input.puzzleTypeSlug,
        ...t,
      })),
    });

    await this.updateBests(input.userId, input.puzzleTypeSlug);

    return data;
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
