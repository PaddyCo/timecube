import { GraphQLScalarType } from "graphql";
import { ClassType, ObjectType, Field, Int, ArgsType } from "type-graphql";

export function PaginatedResponse<TItem>(TItemClass: ClassType<TItem>) {
  @ObjectType({ isAbstract: true })
  abstract class PaginationClass {
    @Field((type) => [TItemClass])
    items: TItem[];

    @Field()
    totalCount: number;

    @Field()
    hasNextPage: boolean;

    @Field()
    hasPreviousPage: boolean;
  }
  return PaginationClass;
}

@ArgsType()
export class PaginationArgs {
  @Field((type) => Int, { nullable: true })
  take: number;
  @Field((type) => Int, { nullable: true })
  skip: number;
}
