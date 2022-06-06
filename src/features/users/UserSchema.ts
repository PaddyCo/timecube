import { Field, ID, Int, ObjectType } from "type-graphql";
import { PaginatedResponse } from "../pagination/PaginationSchema";
import PuzzleType from "../puzzleTypes/PuzzleTypeSchema";
import Time, { BestTimes } from "../times/TimeSchema";

@ObjectType()
export class TimePage {
  @Field((type) => Time)
  items: Time;

  @Field()
  totalCount: number;

  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;
}

@ObjectType()
class User {
  @Field((type) => ID)
  id: string;

  @Field()
  createdAt: Date;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field((type) => TimePage)
  times: TimePage;

  @Field((type) => BestTimes)
  bestTimes: BestTimes;
}

@ObjectType()
export class UserPage extends PaginatedResponse(User) {}

export default User;
