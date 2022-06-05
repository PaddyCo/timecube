import { PrismaClient, Time } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";
import { v4 as uuidv4 } from "uuid";
import TimeService from "./TimeService";
import UserService from "../users/UserService";
import PuzzleTypeService from "../puzzleTypes/PuzzleTypeService";

const prismaMock = mockDeep<PrismaClient>();

const userService = new UserService(prismaMock);
const puzzleTypeService = new PuzzleTypeService(prismaMock);
const timeService = new TimeService(prismaMock, userService, puzzleTypeService);

const mockUser = {
  id: "an-user-id",
  createdAt: new Date(),
  email: "test@test.com",
  name: "Testson",
};

const mockPuzzleType = {
  slug: "cube-3x3x3",
  name: "3x3",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const buildTime = (
  milliseconds: number,
  dnf?: boolean,
  penalty?: number
): Time => {
  return {
    id: uuidv4(),
    userId: mockUser.id,
    puzzleTypeSlug: mockPuzzleType.slug,
    createdAt: new Date(),
    updatedAt: new Date(),
    performedAt: new Date(),
    milliseconds,
    dnf: dnf ? dnf : false,
    penalty: penalty ? penalty : 0,
  };
};

beforeEach(() => {
  prismaMock.user.findUnique.mockResolvedValue(mockUser);
  prismaMock.puzzleType.findUnique.mockResolvedValue(mockPuzzleType);
});

describe("calculateAverage", () => {
  test("calculates ao5 correctly", async () => {
    const ms = [89550, 88500, 96780, 84060, 70940, 85510, 69280];
    prismaMock.time.findMany.mockResolvedValue(ms.map((ms) => buildTime(ms)));

    const times = await timeService.getAll({ take: 5, skip: 0 });
    expect(times[0].ao5).toBe(87370);
    expect(times[1].ao5).toBe(86023);
    expect(times[2].ao5).toBe(80170);
    expect(times[3].ao5).toBe(null);
  });

  test("calculates ao12 correctly", async () => {
    const ms = [
      68070, 52980, 93270, 78630, 88740, 84950, 89550, 88500, 96780, 84060,
      70940, 85510, 69280,
    ];
    prismaMock.time.findMany.mockResolvedValue(ms.map((ms) => buildTime(ms)));

    const times = await timeService.getAll({ take: 3, skip: 0 });
    expect(times[0].ao12).toBe(83222);
    expect(times[1].ao12).toBe(83343);
    expect(times[2].ao12).toBe(null);
  });

  test("calculates ao100 correctly", async () => {
    const ao100Times = [
      67133, 56386, 67280, 80280, 50717, 57970, 73941, 48917, -1, 69707, 52046,
      59506, 49807, 68648, 43157, 71456, 68741, 80958, 62157, 63060, 73589,
      82453, 66445, 53596, 59228, 71829, 75949, 63813, 85469, 54580, 53004,
      62124, 78142, 82877, 59379, 61451, 61884, 65702, 60300, 90174, 77381,
      54267, 59491, 69870, 108161, 87870, 85495, 63676, 55299, 56308, 85622,
      90639, 59819, 44858, 54402, 69765, 55748, 54612, 50387, 76524, 71125,
      48123, 73964, 70804, 48939, 63253, 62916, 59771, 55451, 58876, 100574,
      59171, 70660, 72772, 51187, 59940, 57812, 52860, 64869, 62355, 65805,
      70773, 84333, 55939, 60430, 71092, 66285, 68285, 97575, 67125, 66326,
      70948, 86840, 79285, 88782, 68076, 52980, 93277, 78637, 88742, 84958,
    ];

    prismaMock.time.findMany.mockResolvedValue(
      ao100Times.map((ms) => buildTime(ms, ms === -1))
    );

    const times = await timeService.getAll({ take: 3, skip: 0 });
    expect(times[0].ao100).toBe(66971);
    expect(times[1].ao100).toBe(67169);
    expect(times[2].ao100).toBe(null);
  });

  test("calculates DNFs correctly", async () => {
    const ms = [67280, 80280, 50717, 57970, 73941, 48917, -1, -1, 52046, 59506];
    prismaMock.time.findMany.mockResolvedValue(
      ms.map((ms) => buildTime(ms === -1 ? 50000 : ms, ms === -1))
    );

    const times = await timeService.getAll({ take: 5, skip: 0 });
    expect(times[0].ao5).toBe(66397);
    expect(times[1].ao5).toBe(60876);
    expect(times[2].ao5).toBe(60876);
    expect(times[3].ao5).toBe(null);
    expect(times[4].ao5).toBe(null);
  });
});

afterEach(() => {
  mockReset(prismaMock);
});
