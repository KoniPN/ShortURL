import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
  Database,
  UrlData,
  CreateUrlInput,
  AnalyticsData,
  User,
} from "./types.js";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root directory
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Initialize DynamoDB Client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          sessionToken: process.env.AWS_SESSION_TOKEN,
        }
      : undefined,
});

const docClient = DynamoDBDocumentClient.from(client);

// Table names from environment
const URLS_TABLE = process.env.DYNAMODB_URLS_TABLE || "cloudurlshorter-urls";
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || "cloudurlshorter-users";

const database: Database = {
  // URL Methods
  async createUrl(urlData: CreateUrlInput): Promise<UrlData> {
    const item: UrlData = {
      ...urlData,
      clicks: 0,
      createdAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: URLS_TABLE,
        Item: item,
      })
    );

    return item;
  },

  async getUrl(shortCode: string): Promise<UrlData | null> {
    const response = await docClient.send(
      new GetCommand({
        TableName: URLS_TABLE,
        Key: { shortCode },
      })
    );

    return (response.Item as UrlData) || null;
  },

  async getAllUrls(): Promise<UrlData[]> {
    const response = await docClient.send(
      new ScanCommand({
        TableName: URLS_TABLE,
      })
    );

    return (response.Items as UrlData[]) || [];
  },

  async incrementClicks(shortCode: string): Promise<UrlData | null> {
    const response = await docClient.send(
      new UpdateCommand({
        TableName: URLS_TABLE,
        Key: { shortCode },
        UpdateExpression: "SET clicks = if_not_exists(clicks, :zero) + :inc",
        ExpressionAttributeValues: {
          ":inc": 1,
          ":zero": 0,
        },
        ReturnValues: "ALL_NEW",
      })
    );

    return (response.Attributes as UrlData) || null;
  },

  async deleteUrl(shortCode: string): Promise<boolean> {
    try {
      await docClient.send(
        new DeleteCommand({
          TableName: URLS_TABLE,
          Key: { shortCode },
        })
      );
      return true;
    } catch (error) {
      return false;
    }
  },

  async exists(shortCode: string): Promise<boolean> {
    const url = await database.getUrl(shortCode);
    return url !== null;
  },

  async getAnalytics(shortCode: string): Promise<AnalyticsData> {
    const url = await database.getUrl(shortCode);
    if (!url) {
      return { url: null, clicks: 0 };
    }
    return {
      url: url,
      clicks: url.clicks,
      createdAt: url.createdAt,
    };
  },

  async getUserUrls(userId: string): Promise<UrlData[]> {
    const response = await docClient.send(
      new QueryCommand({
        TableName: URLS_TABLE,
        IndexName: "UserIdIndex",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      })
    );

    return (response.Items as UrlData[]) || [];
  },

  // User Methods
  async createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
    const id = `user_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const user: User = {
      id,
      ...userData,
      createdAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: {
          userId: id,
          email: user.email,
          password: user.password,
          createdAt: user.createdAt,
        },
      })
    );

    return user;
  },

  async findUserByEmail(email: string): Promise<User | null> {
    const response = await docClient.send(
      new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: "EmailIndex",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email.toLowerCase(),
        },
      })
    );

    const items = response.Items;
    if (!items || items.length === 0) return null;

    const dbUser = items[0];
    return {
      id: dbUser.userId,
      email: dbUser.email,
      password: dbUser.password,
      createdAt: dbUser.createdAt,
    };
  },

  async findUserById(userId: string): Promise<User | null> {
    const response = await docClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId },
      })
    );

    const dbUser = response.Item;
    if (!dbUser) return null;

    return {
      id: dbUser.userId,
      email: dbUser.email,
      password: dbUser.password,
      createdAt: dbUser.createdAt,
    };
  },
};

export default database;
