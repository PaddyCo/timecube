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
  PubSub,
  PubSubEngine,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";
import { Service } from "typedi";
import Time, { NewTimePayload } from "./TimeSchema";
import UserBest from "../users/UserBestsSchema";
import PuzzleTypeService from "../puzzleTypes/PuzzleTypeService";
import TimeService from "./TimeService";
import UserService from "../users/UserService";
import { PaginationArgs } from "../pagination/PaginationSchema";

@ArgsType()
class TimesArgs extends PaginationArgs {
  @Field((type) => ID, { nullable: true })
  userId: string;
  @Field((type) => ID, { nullable: true })
  puzzleTypeSlug: string;
}

@ArgsType()
export class NewTimeSubscriptionArgs {
  @Field((type) => ID)
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
export class UpdateBestsInput {
  @Field()
  userId: string;
  @Field()
  puzzleTypeSlug: string;
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
export class BatchOutput {
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
    const data = await this.timeService.getMany({
      take,
      skip,
      userId,
      puzzleTypeSlug,
    });

    return data.items.map((t) => ({
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
  async postTime(
    @PubSub() pubSub: PubSubEngine,
    @Arg("input") input: PostTimeInput
  ) {
    console.log("PUBSUB:", pubSub);
    const time = await this.timeService.create(input);
    await pubSub.publish("TIMES", time);
    return time;
  }

  @Mutation((returns) => BatchOutput)
  async batchPostTime(@Arg("input") input: BatchPostTimeInput) {
    return await this.timeService.batchCreate(input);
  }

  @Mutation((returns) => BatchOutput)
  async updateBests(@Arg("input") input: UpdateBestsInput) {
    return await this.timeService.updateBests(
      input.userId,
      input.puzzleTypeSlug
    );
  }

  @Subscription((returns) => NewTimePayload, {
    topics: "TIMES",
    filter: ({ payload, args }) => payload.userId == args.userId,
  })
  async newTime(
    @Root() timePayload: Time,
    @Args() { userId, puzzleTypeSlug }: NewTimeSubscriptionArgs
  ) {
    // TODO: Filter in subscription?
    const bests = await this.timeService.getBests(userId, puzzleTypeSlug);
    return {
      time: timePayload,
      bests,
    };
  }
}

export default TimeResolver;
