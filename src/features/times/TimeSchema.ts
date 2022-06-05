import { Field, ID, Int, ObjectType } from "type-graphql";
import PuzzleType from "../puzzleTypes/PuzzleTypeSchema";
import User from "../users/UserSchema";

@ObjectType()
class Time {
  @Field((type) => ID)
  id: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  performedAt: Date;

  @Field((type) => Int)
  milliseconds: number;

  @Field((type) => Int, { nullable: true })
  ao5: number;

  @Field((type) => Int, { nullable: true })
  ao12: number;

  @Field((type) => Int, { nullable: true })
  ao100: number;

  @Field((type) => Int, { nullable: true })
  mo3: number;

  @Field((type) => Int, { nullable: true })
  penalty: number;

  @Field({ nullable: true })
  notes: string;

  @Field()
  dnf: boolean;

  @Field()
  user: User;

  @Field()
  puzzleType: PuzzleType;
}

export default Time;
