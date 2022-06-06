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
import User, { UserPage } from "./UserSchema";
import PuzzleTypeService from "../puzzleTypes/PuzzleTypeService";
import UserService from "./UserService";
import TimeService from "../times/TimeService";
import { PaginationArgs } from "../pagination/PaginationSchema";
import { TimePage } from "../times/TimeSchema";

@ArgsType()
class TimesArgs extends PaginationArgs {
  @Field((type) => ID)
  puzzleType: string;
}

@ArgsType()
class UserArgs {
  @Field((type) => ID)
  userId: string;
}

@ArgsType()
class BestTimesArgs {
  @Field((type) => ID)
  puzzleType: string;
}

@Service()
@Resolver(User)
class UserResolver {
  constructor(
    private timeService: TimeService,
    private userService: UserService,
    private puzzleTypeService: PuzzleTypeService
  ) {}

  @Query((returns) => UserPage)
  async users(@Args() { skip, take }: PaginationArgs) {
    return await this.userService.getMany({
      take,
      skip,
    });
  }

  @Query((returns) => User)
  async user(@Args() { userId }: UserArgs) {
    return await this.userService.get(userId);
  }

  @FieldResolver()
  async bestTimes(@Root() user: User, @Args() { puzzleType }: BestTimesArgs) {
    return await this.timeService.getBests(user.id, puzzleType);
  }

  @FieldResolver((returns) => TimePage)
  async times(
    @Root() user: User,
    @Args() { skip, take, puzzleType }: TimesArgs
  ) {
    const times = await this.timeService.getMany({
      skip,
      take,
      userId: user.id,
      puzzleTypeSlug: puzzleType,
    });

    console.log(times);

    return times;
  }
}

export default UserResolver;
