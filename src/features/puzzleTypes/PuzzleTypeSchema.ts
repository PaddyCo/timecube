import { Field, ID, Int, ObjectType } from "type-graphql";

@ObjectType()
class PuzzleType {
  @Field((type) => ID)
  slug: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  name: string;
}

export default PuzzleType;
