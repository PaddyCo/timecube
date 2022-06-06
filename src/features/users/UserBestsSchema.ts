import { Field, ID, Int, ObjectType } from "type-graphql";

@ObjectType()
export default class UserBest {
  @Field((type) => ID)
  userId: string;

  @Field((type) => ID)
  timeId: string;
}
