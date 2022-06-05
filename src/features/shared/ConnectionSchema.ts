import { GraphQLScalarType } from "graphql";
import { ClassType, ObjectType, Field, Int } from "type-graphql";

export default function PaginatedResponse<T>(
  itemsFieldValue: ClassType<T> | GraphQLScalarType | String | Number | Boolean
) {
  // `isAbstract` decorator option is mandatory to prevent registering in schema
  @ObjectType({ isAbstract: true })
  abstract class PaginatedResponseClass {
    // here we use the runtime argument
    @Field((type) => [itemsFieldValue])
    // and here the generic type
    items: T[];

    @Field((type) => Int)
    total: number;

    @Field()
    hasMore: boolean;
  }
  return PaginatedResponseClass;
}
