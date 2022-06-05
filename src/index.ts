import "reflect-metadata"; // Required by typegraphql
import express, { Express } from "express";
import cors from "cors";
import { Prisma, PrismaClient, Time } from "@prisma/client";
import websocketServer from "./websocketServer";
import { buildSchema } from "type-graphql";
import TimeResolver from "./features/times/TimeResolver";
import { graphqlHTTP } from "express-graphql";
import Container from "typedi";
import TimeService from "./features/times/TimeService";
import UserResolver from "./features/users/UserResolver";

const app: Express = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT;

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});
Container.set(PrismaClient, prisma);

const schema = buildSchema({
  resolvers: [TimeResolver, UserResolver],
  container: Container,
}).then((schema) => {
  app.use(
    "/graphql",
    graphqlHTTP({
      schema,
      graphiql: true,
    })
  );
});

const server = app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});

const wsServer = websocketServer(server);
