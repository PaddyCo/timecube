import {
  Arg,
  Args,
  ArgsType,
  Field,
  FieldResolver,
  ID,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import { Service } from "typedi";
import Time from "./TimeSchema";
import PuzzleTypeService from "../puzzleTypes/PuzzleTypeService";
import TimeService from "./TimeService";
import UserService from "../users/UserService";
import { CollectionArgs } from "../shared/commonSchemas";

@ArgsType()
class TimesArgs extends CollectionArgs {
  @Field((type) => ID, { nullable: true })
  userId: string;
  @Field((type) => ID, { nullable: true })
  puzzleTypeSlug: string;
}

@InputType()
export class PostTimeInput {
  @Field((type) => Int)
  milliseconds: number;
  @Field({ nullable: true })
  performedAt: Date;
  @Field()
  userId: string;
  @Field()
  puzzleTypeSlug: string;
  @Field((type) => Int, { nullable: true })
  penalty: number;
  @Field({ nullable: true })
  dnf: boolean;
}

@InputType()
export class BatchPostTimeInputRow {
  @Field((type) => Int)
  milliseconds: number;
  @Field({ nullable: true })
  performedAt: Date;
  @Field((type) => Int, { nullable: true })
  penalty: number;
  @Field({ nullable: true })
  dnf: boolean;
}

@InputType()
export class BatchPostTimeInput {
  @Field()
  userId: string;
  @Field()
  puzzleTypeSlug: string;
  @Field((type) => [BatchPostTimeInputRow])
  data: BatchPostTimeInputRow[];
}

@ObjectType()
export class BatchPostTimeOutput {
  @Field()
  count: number;
}

@Service()
@Resolver(Time)
class TimeResolver {
  constructor(
    private timeService: TimeService,
    private userService: UserService,
    private puzzleTypeService: PuzzleTypeService
  ) {}

  @Query((returns) => [Time])
  async times(@Args() { skip, take, userId, puzzleTypeSlug }: TimesArgs) {
    const data = await this.timeService.getAll({
      take,
      skip,
      userId,
      puzzleTypeSlug,
    });

    return data.map((t) => ({
      ...t,
      user: {
        id: t.userId,
      },
      puzzleType: {
        slug: t.puzzleTypeSlug,
      },
    }));
  }

  @FieldResolver()
  async user(@Root() time: Time) {
    return await this.userService.get(time.user.id);
  }

  @FieldResolver()
  async puzzleType(@Root() time: Time) {
    return await this.puzzleTypeService.get(time.puzzleType.slug);
  }

  @Mutation((returns) => Time)
  async postTime(@Arg("input") input: PostTimeInput) {
    return await this.timeService.create(input);
  }

  @Mutation((returns) => BatchPostTimeOutput)
  async batchPostTime(@Arg("input") input: BatchPostTimeInput) {
    return await this.timeService.batchCreate(input);
  }
}

export default TimeResolver;
