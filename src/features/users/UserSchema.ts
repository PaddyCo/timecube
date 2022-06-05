import { Field, ID, Int, ObjectType } from "type-graphql";
import PuzzleType from "../puzzleTypes/PuzzleTypeSchema";
import PaginatedResponse from "../shared/ConnectionSchema";
import Time from "../times/TimeSchema";

@ObjectType()
export class TimesConnection extends PaginatedResponse(Time) {
  // we can freely add more fields or overwrite the existing one's types
  @Field((type) => [String])
  otherInfo: string[];
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

  @Field((type) => [Time])
  times: [Time];

  @Field((type) => TimesConnection)
  timesConnection: TimesConnection;
}

export default User;
