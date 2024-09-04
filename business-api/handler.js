import express from "express";
import cors from "cors";
import serverless from "serverless-http";
import { authMiddleware } from "auth-sdk";

const app = express();

/**
 * Add the JSON body parser middleware to Express.js, and CORS middleware to
 * allow cross-origin requests from the browser.
 */
app.use(cors());
app.use(express.json());

/**
 * Adds the authentication middleware from the auth-sdk. This middleware
 * validates the JWT token in the Authorization header of the incoming request
 * and throws a UnauthorizedError if the token is invalid.
 */
app.use(authMiddleware());

/**
 * This is a placeholder for your business logic. Replace this endpoint and add
 * others for whatever your application needs.
 */
app.get("/", async (req, res) => {
  res.json({ message: "hello from an authenticated endpoint" });
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ error: "Invalid token" });
  } else {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export const handler = serverless(app);
