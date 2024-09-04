import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  AccessDeniedException,
  BedrockRuntimeClient,
  ConverseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { z } from "zod";

import { Auth } from "auth-sdk";

/**
 * A small utility to easily capture the status codes in the error handlers.
 */
class HTTPError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Initialize the AWS SDK Dynamo Doc Client.
 */
const USAGE_TABLE_NAME = process.env.USAGE_TABLE_NAME;
const dynamoDbClient = new DynamoDBClient();
const dynamoDbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);

/**
 * Defines the zod schema for the input payload to pass on to AWS Bedrock's
 * model. This is passed to the ConverseStreamCommand as a part of the user
 * input.
 */
const inputMessageSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.array(
        z.object({
          text: z.string(),
        })
      ),
    })
  ),
});

/**
 * The awslambda.streamifyResponse is a utility provided in the lambda runtime
 * to stream the response. Unfortunately this utility is not available
 * externally at the moment, therefore this method can't be run locally using
 * Serverless Dev mode.
 */
export const handler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {
    /**
     * responseStream is a Writeable Stream and doesn't provide method to update
     * the headers, statusCode, therefore we use HttpResponseStream.from to
     * create a new responseStream with the new response headers.
     */
    const updateStream = ({ statusCode } = {}) => {
      const httpResponseMetadata = {
        statusCode: statusCode || 200,
        headers: {
          "Content-Type": "application/json",
        },
      };

      responseStream = awslambda.HttpResponseStream.from(
        responseStream,
        httpResponseMetadata
      );
    };

    try {
      const runtimeClient = new BedrockRuntimeClient({ region: "us-east-1" });
      const authenticator = new Auth({
        secret: process.env.SHARED_TOKEN_SECRET,
      });

      /**
       * Extract, parser, and validate the JWT Token from the Authorization
       * header.
       */
      const requestTokenHeader =
        event.headers.Authorization || event.headers.authorization;
      const [authSchema, authorizationParameter] = (
        requestTokenHeader || ""
      ).split(" ");

      if (
        !requestTokenHeader ||
        authSchema !== "Bearer" ||
        !authorizationParameter
      ) {
        throw new HTTPError(
          403,
          "Missing bearer token in Authorization header"
        );
      }

      const token = authenticator.verify(authorizationParameter);
      if (!token) {
        throw new HTTPError(403, "Invalid token");
      }
      const { userId } = token;

      /**
       * This is a simple throttle mechanism to limit the number of requests
       * per user per month. This throttles based on per-user limits as well as
       * a global limit. At the end of each request, the usage is updated in the
       * DynamoDB table, including the request count, input tokens, output
       * tokens, and total tokens.
       *
       * This uses the request count to throttle. Using other metrics, like the
       * inputTokens or totalTokens, is also possible by switching out the
       * `invocationCount` with the desired metric.
       *
       * This also uses the Model ID as the secondary key, in which case, the
       * throttle limits are calculated per model.
       */
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const queryParams = (pk) => ({
        TableName: process.env.USAGE_TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND SK = :sk",
        ExpressionAttributeValues: {
          ":pk": pk,
          ":sk": `MODEL#${process.env.MODEL_ID}`,
        },
      });

      const userUsageKey = `USER#${userId}#${startOfMonth.toISOString()}`;
      const globalUsageKey = `GLOBAL#${startOfMonth.toISOString()}`;

      const userUsageCommand = new QueryCommand(queryParams(userUsageKey));
      const userUsageRecords = await dynamoDbDocClient.send(userUsageCommand);
      const userUsageMetrics = userUsageRecords.Items[0];

      const globalUsageCommand = new QueryCommand(queryParams(globalUsageKey));
      const globalUsageRecords = await dynamoDbDocClient.send(
        globalUsageCommand
      );
      const globalUsageMetrics = globalUsageRecords.Items[0];

      if (
        userUsageMetrics?.invocationCount >=
          process.env.THROTTLE_MONTHLY_LIMIT_USER ||
        globalUsageMetrics?.invocationCount >=
          process.env.THROTTLE_MONTHLY_LIMIT_GLOBAL
      ) {
        throw new HTTPError(
          429,
          `User has exceeded the user or global monthly usage limit`
        );
      }

      /**
       * Parse and validate the input payload from the request body before
       * passing it on to AWS Bedrock.
       */
      let messages = {};
      try {
        messages = JSON.parse(event.body);
      } catch {
        throw new HTTPError(400, "Invalid JSON format in the request body");
      }

      try {
        inputMessageSchema.parse({ messages });
      } catch (e) {
        const issuePath = e.issues[0].path.join(".");
        const issueMessage = e.issues[0].message;
        const errorMessage = `Invalid value at '${issuePath}': ${issueMessage}`;
        throw new HTTPError(400, errorMessage);
      }

      /**
       * Update the response stream with the defaults just before starting the
       * streaming response.
       */
      updateStream();

      /**
       * Details about this command can be found in the AWS SDK for JavaScript v3.
       * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/bedrock-runtime/command/ConverseStreamCommand/
       */
      const input = {
        modelId: process.env.MODEL_ID,
        system: [
          {
            text: "You are a helpful bot.",
          },
        ],
        messages,
      };

      const command = new ConverseStreamCommand(input);
      const converseResponse = await runtimeClient.send(command);

      let usage = {};

      for await (const event of converseResponse.stream) {
        const {
          metadata,
          internalServerException,
          modelStreamErrorException,
          validationException,
          throttlingException,
          ...contentResponse
        } = event;

        /**
         * Metadata includes internal properties that should not be passed on to
         * the client via the HTTP response, so we log them for output only.
         * This also saves the metadata.usage object, which is later used to
         * record the usage in the DynamoDB table.
         */
        if (metadata) {
          console.log(metadata);
          usage = metadata.usage;
        }

        /**
         * The AWS Bedrock ConversesStreamCommand doesn't throw errors, instead,
         * it returns the error in the response. This checks each of the types
         * of errors and throws an error with the message.
         *
         * In production consider using a more detailed error message, and
         * more gracefully handling the errors.
         */
        const exception =
          internalServerException ||
          modelStreamErrorException ||
          validationException ||
          throttlingException;

        if (exception) {
          throw new Error(exception.message);
        }
        responseStream.write(contentResponse);
      }

      /**
       * Records the usage in the usage table, including the userId, timestamp,
       * and the number of tokens used from the AWS Bedrock model. The token
       * usage is just informative. The throttling uses the number of requests
       * to limit the number of requests per user per month.
       */
      const updateParams = (pk) => ({
        TableName: USAGE_TABLE_NAME,
        Key: {
          PK: pk,
          SK: `MODEL#${process.env.MODEL_ID}`,
        },
        UpdateExpression:
          "ADD invocationCount :inc, inputTokens :in, outputTokens :out, totalTokens :tot",
        ExpressionAttributeValues: {
          ":inc": 1,
          ":in": usage.inputTokens || 0,
          ":out": usage.outputTokens || 0,
          ":tot": usage.totalTokens || 0,
        },
      });
      const userUsageUpdateCommand = new UpdateCommand(
        updateParams(userUsageKey)
      );
      const globalUsageUpdateCommand = new UpdateCommand(
        updateParams(globalUsageKey)
      );
      await dynamoDbDocClient.send(userUsageUpdateCommand);
      await dynamoDbDocClient.send(globalUsageUpdateCommand);
    } catch (error) {
      console.error(event);
      console.error(error);
      if (error instanceof HTTPError) {
        updateStream({ statusCode: error.statusCode });
        responseStream.write({ error: error.message });
      } else if (error instanceof AccessDeniedException) {
        const message =
          "Access denied to AWS Bedrock - Please ensure the model is enabled in the AWS Bedrock console.";
        updateStream({ statusCode: 500 });
        responseStream.write({ error: message });
      } else {
        updateStream({ statusCode: 500 });
        responseStream.write({ error: "Internal Error" });
      }
    } finally {
      responseStream.end();
      return;
    }
  }
);
