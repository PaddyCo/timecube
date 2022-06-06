import { Field, ID, Int, ObjectType } from "type-graphql";
import { PaginatedResponse } from "../pagination/PaginationSchema";
import PuzzleType from "../puzzleTypes/PuzzleTypeSchema";
import Time from "../times/TimeSchema";

@ObjectType()
export default class UserBest {
  @Field((type) => ID)
  userId: string;

  @Field((type) => ID)
  timeId: string;
}
