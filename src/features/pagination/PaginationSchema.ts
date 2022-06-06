import { GraphQLScalarType } from "graphql";
import { ClassType, ObjectType, Field, Int, ArgsType } from "type-graphql";

export function PaginatedResponse<T>(edge: ClassType<T>) {
  @ObjectType({ isAbstract: true })
  abstract class ConnectionClass {
    @Field((type) => [edge])
    items: T[];

    @Field()
    totalCount: number;

    @Field()
    hasNextPage: boolean;

    @Field()
    hasPreviousPage: boolean;
  }
  return ConnectionClass;
}

@ArgsType()
export class PaginationArgs {
  @Field((type) => Int, { nullable: true })
  take: number;
  @Field((type) => Int, { nullable: true })
  skip: number;
}
