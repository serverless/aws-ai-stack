import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  PutCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import express from "express";
import cors from "cors";
import serverless from "serverless-http";
import { authMiddleware } from "auth-sdk";

const app = express();

/**
 * Initialize the AWS SDK Dynamo Doc Client.
 */
const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME;
const dynamoDbClient = new DynamoDBClient();
const dynamoDbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);

/**
 * Initialize the AWS SDK EventBridge Client.
 */
const eventBridgeClient = new EventBridgeClient();

/**
 * Add the JSON body parser middleware to Express.js, and CORS middleware to
 * allow cross-origin requests from the browser.
 */
app.use(cors());
app.use(express.json());

app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  /**
   * This example has inline validation for the email and password; however,
   * in a real-world application, you would want to use a middleware library
   * like express-validator to validate the request payload.
   */
  if (typeof email !== "string" || email.length < 4) {
    res
      .status(400)
      .json({ error: "'email' must be a string and at least 4 chars long" });
    return;
  }

  if (typeof password !== "string" || password.length < 8) {
    res
      .status(400)
      .json({ error: "'password' must be a string and at least 8 chars long" });
    return;
  }

  /**
   * Before creating a new user, check if the user already exists.
   */
  try {
    const params = {
      TableName: USERS_TABLE_NAME,
      IndexName: "emailIndex",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
    };
    const command = new QueryCommand(params);
    const { Items } = await dynamoDbDocClient.send(command);
    if (Items.length > 0) {
      res.status(400).json({ error: "User already exists" });
      return;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not create user" });
    return;
  }

  /**
   * The password is hashed using bcrypt before storing it in the dynamo.
   */
  const passwordHash = await bcrypt.hash(password, 10);

  /**
   * Saves the user in the DynamoDB table.
   */
  try {
    const userId = uuid();
    const command = new PutCommand({
      TableName: USERS_TABLE_NAME,
      Item: {
        email,
        passwordHash,
        userId,
      },
    });
    await dynamoDbDocClient.send(command);

    /**
     * The user is created successfully, and we can send an event to the Event
     * Bridge to notify other services that a new user has been created.
     */
    const eventPayload = {
      Entries: [
        {
          Source: "auth.register",
          EventBusName: process.env.EVENT_BUS_NAME,
          DetailType: "authRegisterType",
          Detail: JSON.stringify({ email, userId }),
        },
      ],
    };
    const eventBridgeCommand = new PutEventsCommand(eventPayload);
    await eventBridgeClient.send(eventBridgeCommand);

    /**
     * The user is created successfully, and we can generate a JWT token to send
     * in response to the client.
     */
    const token = jwt.sign({ email, userId }, process.env.SHARED_TOKEN_SECRET, {
      expiresIn: "1w",
    });
    res.json({ token, email, userId });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not create user" });
    return;
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  /**
   * Validate the email and password were provided.
   */
  if (!email || !password) {
    res.status(400).json({ error: "Invalid email or password" });
    return;
  }

  try {
    /**
     * Query the DynamoDB table to get the user by email. Since this is a GSI,
     * we use a Query operation instead of a Get operation, and therefore the
     * response will be an array of items.
     */
    const params = {
      TableName: USERS_TABLE_NAME,
      IndexName: "emailIndex", // Specify the name of the GSI
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
    };
    const command = new QueryCommand(params);
    const { Items } = await dynamoDbDocClient.send(command);
    if (!Items || Items.length === 0) {
      res.status(400).json({ error: "Invalid email or password" });
      return;
    }

    /**
     * Get the userId and passwordHash from the first item in the response, and
     * use bcrypt to validate the password.
     */
    const { passwordHash, userId } = Items[0];
    const isPasswordValid = await bcrypt.compare(password, passwordHash);
    if (!isPasswordValid) {
      res.status(400).json({ error: "Invalid email or password" });
      return;
    }

    /**
     * The user is authenticated successfully, and we can generate a JWT token
     * to send in response to the client, with the email address and userId.
     */
    const token = jwt.sign({ email, userId }, process.env.SHARED_TOKEN_SECRET, {
      expiresIn: "1w",
    });

    res.json({ token, email, userId });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not log in" });
    return;
  }
});

app.delete("/users/:userId", authMiddleware(), async (req, res) => {
  const tokenUserId = req.auth.userId;
  const paramUserId = req.params.userId;

  if (tokenUserId !== paramUserId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const command = new DeleteCommand({
    TableName: USERS_TABLE_NAME,
    Key: { userId: tokenUserId },
  });
  await dynamoDbDocClient.send(command);

  res.json({});
  return;
});

app.get("/users/:userId", authMiddleware(), async (req, res) => {
  const tokenUserId = req.auth.userId;
  const paramUserId = req.params.userId;

  if (tokenUserId !== paramUserId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const command = new GetCommand({
    TableName: USERS_TABLE_NAME,
    Key: { userId: tokenUserId },
  });
  const { Item } = await dynamoDbDocClient.send(command);

  if (!Item) {
    res.status(404).json({ error: "Not Found" });
    return;
  }

  res.json({ userId: Item.userId, email: Item.email });
  return;
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ error: "Invalid token" });
  } else {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

export const handler = serverless(app);
