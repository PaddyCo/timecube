import { ArgsType, Field, Int } from "type-graphql";

@ArgsType()
export class CollectionArgs {
  @Field((type) => Int, { nullable: true })
  skip: number;
  @Field((type) => Int, { nullable: true })
  take: number;
}
