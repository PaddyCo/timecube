import "reflect-metadata"; // Required by typegraphql
import { PrismaClient } from "@prisma/client";
import { buildSchema } from "type-graphql";
import TimeResolver from "./features/times/TimeResolver";
import Container from "typedi";
import UserResolver from "./features/users/UserResolver";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import { createServer } from "http";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { PubSub } from "graphql-subscriptions";

async function bootstrap() {
  const app = express();
  const httpServer = createServer(app);

  const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });
  Container.set(PrismaClient, prisma);

  const pubSub = new PubSub();
  const schema = await buildSchema({
    resolvers: [TimeResolver, UserResolver],
    container: Container,
    pubSub,
  });

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/",
  });

  const serverCleanup = useServer({ schema }, wsServer);

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();
  server.applyMiddleware({
    app,
    cors: {
      origin: "*",
    },
    path: "/",
  });

  const port = process.env.PORT;
  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  console.log(
    `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
  );
}

bootstrap();
