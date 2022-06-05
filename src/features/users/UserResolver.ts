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
import User, { TimesConnection } from "./UserSchema";
import PuzzleTypeService from "../puzzleTypes/PuzzleTypeService";
import UserService from "./UserService";
import TimeService from "../times/TimeService";
import Time from "../times/TimeSchema";
import { CollectionArgs } from "../shared/commonSchemas";

@ArgsType()
class TimesArgs extends CollectionArgs {
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

  @Query((returns) => [User])
  async users(@Args() { skip, take }: CollectionArgs) {
    return await this.userService.getAll({
      take,
      skip,
    });
  }

  @FieldResolver()
  async times(
    @Root() user: User,
    @Args() { skip, take, puzzleType }: TimesArgs
  ) {
    return await this.timeService.getAll({
      skip,
      take,
      userId: user.id,
      puzzleTypeSlug: puzzleType,
    });
  }

  @Query()
  timesConnection(): TimesConnection {
    // here is your custom business logic,
    // depending on underlying data source and libraries
    return {
      items: [],
      total: 4,
      hasMore: true,
      otherInfo: ["Wow"],
    };
  }
}

export default UserResolver;
