#sudo su 
[![AWS AI Stack](https://github.com/user-attachments/assets/0550b6d6-5b97-4549-92a0-9c919d8e0b45)](https://awsaistack.com)

**AWS AI Stack** – A ready-to-use, full-stack boilerplate project for building serverless AI applications on AWS. A great fit for those seeking a trusted AWS foundation for AI apps and access to powerful LLM models via Bedrock ​​that keep your app’s data separate from model providers.


**[View the Live Demo – awsaistack.com](https://awsaistack.com)**

Use this as a boilerplate project to create an AI Chat bot, authentication services, business logic, async workers, all on AWS Lambda, API Gateway, DynamoDB, and EventBridge.

This is a true serverless architecture, so you only pay for what you use, not for idle time. Some services, like DynamoDB, or AWS Bedrock trained models, may have additional storage costs.

<a href="https://awsaistack.com" target="_blank"><img width="2000" alt="serverless-framework-v4-aws-ai-stack-screenshots" src="https://github.com/user-attachments/assets/fb25ed2d-6077-4a5f-94f2-121ba59213c6"></a>

# Features

- **Full-Stack Application**
  - Backend: API (AWS API Gateway V2, AWS Lambda), Event-driven architecture (AWS Event-Bridge, AWS Lambda), Database (AWS DynamoDB), AI (AWS Bedrock)
  - Frontend: Vanilla React app.
- **AI Chat & Streaming Responses**
  - Full serverless AI Chat architecture w/ streaming responses on AWS Lambda.
- **Multiple AI Models & Data Privacy**
  - Use one or multiple models via AWS Bedrock: Claude 3.5 Sonnet, Llama3.1, Mistral Large 2, and many more.
  - App data never leaves AWS and is not sent to model providers.
- **100% Serverless**
  - This is a true serverless architecture. It auto-scales and you only pay when users use it. Some services may have additional storage costs.
- **Custom Domain Names**
  - Custom domain names for API Gateway services using the `serverless-domain-manager` plugin
  - Custom domain names for Lambda services using CloudFront Distributions
- **API & Event-Driven**
  - Express.js API placeholder service for your business logic
  - Shared EventBridge to public & subscribe to events
  - Worker service to process events from EventBridge
- **Built-In Authentication**
  - API Gateway authorizer
  - Login & Registration API on Lambda with Express.js
  - DynamoDB table to store user information
  - Shared library to provide JWT token authentication
  - Frontend website that uses login & registration API
- **Multi-Environment**
  - Shared configuration for all services.
  - Separated configuration for different environments.
- **Domain Oriented Architecture**
  - This project is domain-oriented so you can easily remove the pieces you don't need, like AI Chat, authentication, etc.
- **CI/CD with Github Action**
  - Github Actions to deploy the services to prod.
  - Github Actions to deploy PRs & remove services after merge.

# Getting Started

## 1. Install dependencies

**Install Serverless Framework**

```
npm i -g serverless
```

**Install NPM dependencies**

This project is structured as a monorepo with multiple services. Each service
has its own `package.json` file, so you must install the dependencies for each
service. Running `npm install` in the root directory will install the
dependencies for all services.

```
npm install
```

**Setup AWS Credentials**

If you haven't already, setup your AWS Credentials. You can follow the [AWS Credentials doc](https://www.serverless.com/framework/docs/providers/aws/guide/credentials)
for step-by-step instructions.

## 2. Enable AWS Bedrock Models

This example requires the `meta.llama3-70b-instruct-v1:0` AWS Bedrock
Model to be enabled. By default, AWS does not enable these models, you must go
to the [AWS Console](https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/models)
and individually request access to the AI Models.

There is no cost to enable the models, but you must request access to use them.

Upon request, it may take a few minutes for AWS to enable the model. Once they
are enabled, you will receive an email from AWS confirming the model is enabled.

Some users have reported issues with getting models enabled on AWS Bedrock. Make
sure you have sufficient permissions in AWS to enable the models first. Often, 
AWS accounts that are new or have not historically had a monthly invoice over a few
dollars may require contacting AWS to enable models.

## 3. Deploy & start developing

Now you are ready to deploy the services. This will deploy all the services
to your AWS account. You can deploy the services to the `default` stage, which
is the default stage for development.

**Deploy the services**

```
serverless deploy
```

At this point the service is live. When running the `serverless deploy` command,
you will see the output of the services that were deployed. One of those
services is the `web` service, which is the website service. To view the app,
go to the URL in the `endpoint: ANY - ` section for the `web` service.

```
Deploying "web" to stage "dev" (us-east-1)

endpoint: ANY - https://ps5s7dd634.execute-api.us-east-1.amazonaws.com
functions:
  app: web-dev-app (991 kB)

```

Once you start developing it is easier to run the service locally for faster
iteration. We recommend using [Serverless Dev Mode](https://www.serverless.com/framework/docs/providers/aws/cli-reference/dev).
You can run Dev Mode for individual services. This emulates Lambda locally and
proxies requests to the real service.

```
serverless auth dev
```

Once done, you can redeploy individual services using the `serverless` command
with the service name.

```
serverless auth deploy
```

The `website` service is a static website that is served from an AWS Lambda
function. As such, it can run locally without needing to use Dev Mode. However,
it has a dependency on the AI Chat service and the Auth service, so you must
configure environment variables locally.

```
# If you have the jq CLI command installed you can use that with the --json flag
# on serverless info to get the URLs from the deployed services. If you do not
# have jq installed, you can get the URLs by running "serverless auth info" and
# "serverless ai-chat info" and copying the URLs manually into the environment
# variables.
export VITE_CHAT_API_URL=$(serverless aiChatApi info --json | jq -r '.outputs[] | select(.OutputKey == "ChatApiUrl") | .OutputValue')
export VITE_AUTH_API_URL=$(serverless auth info --json | jq -r '.outputs[] | select(.OutputKey == "AuthApiUrl") | .OutputValue')

# now you can run the local development server
cd website/app
npm run build
```

## 4. Prepare & release to prod

Now that the app is up and running in a development environment, lets get it
ready for production by setting up a custom domain name, and setting a new
shared secret for JWT token authentication.

### Setup Custom Domain Name (optional)

This project is configured to use custom domain names. For non `prod`
deployments this is disabled. Deployments to `prod` are designed to use a custom
domain name and require additional setup:

**Register the domain name & create a Route53 hosted zone**

If you haven't already, register a domain name, and create a Route53 hosted zone
for the domain name.

https://us-east-1.console.aws.amazon.com/route53/v2/hostedzones?region=us-east-1#

**Create a Certificate in AWS Certificate Manager**

A Certificate is required in order to use SSL (`https`) with a custom domain
name. AWS Certificate Manager (ACM) provides free SSL certificates for use with
your custom domain name. A certificate must first be requested, which requires
verification, and may take a few minutes.

https://us-east-1.console.aws.amazon.com/acm/home?region=us-east-1#/certificates/list

After you have created the certificate, you must validate the certificate by
following the instructions in the AWS Console. This may require adding a CNAME
record to your DNS provider.

This example uses a Certificate with the following full qualified domain names:

```

awsaistack.com
\*.awsaistack.com

```

The base domain name, `awsaistack.com` is used for the website service
to host the static website. The wildcard domain name,
`*.awsaistack.com` is used for the API services,
`api.awsaistack.com`, and `chat.awsaistack.com`.

**Update serverless-compose.yml**

- Update the `stages.prod.params.customDomainName` to your custom domain name.
- Update the `stages.prod.params.customDomainCertificateARN` to the ARN of the
  certificate you created in ACM.

### Create the secret for JWT token authentication

Authentication is implemented using JWT tokens. A shared secret is used to sign
the JWT tokens when a user logs in. The secret is also used to verify the JWT
tokens when a user makes a request to the API. It is important that this secret
is kept secure and not shared.

In the `serverless-compose.yml` file, you'll see that the `sharedTokenSecret` is
set to `"DEFAULT"` in the `stages.default.params` section. This is a placeholder
value that is used when the secret is not provided in non-prod environments.

The `prod` stage uses the `${ssm}` parameter to retrieve the secret from AWS
Systems Manager Parameter Store.

Generate a random secret and store it in the AWS Systems Manager Parameter Store
with a key like `/serverless-ai-service/shared-token`, and set it in the
`stages.prod.params.sharedTokenSecret` parameter in the `serverless-compose.yml`
file:

```
sharedTokenSecret: ${ssm:/serverless-ai-service/shared-token}
```

### Deploy to prod

Once you've setup the custom domain name (optional), and created the secret, you
are ready to deploy the service to prod.

```

serverless deploy --stage prod

```

Now you can use the service by visiting your domain name, or
https://awsaistack.com. This uses the Auth service to login and
register users, the AI Chat service to interact with the AI Chat bot.

# Architectural Overview

## Serverless & Costs

This example uses serverless services like AWS Lambda, API Gateway, DynamoDB,
EventBridge, and CloudFront. These services are designed to scale with usage,
and you only pay for what you use. This means you do not pay for idle, and
only pay for the resources you consume. If you have 0 usage, you will have $0
cost.

If you are using the custom domain names, it will require Route53 which has a
fixed monthly cost.

## Compose

This example uses Serverless Compose to share configuration across all services.

It defines the global parameters in the `serverless-compose.yml` file under
`stages.default.params` and `stages.prod.params`. These parameters are used
across all services to provide shared configuration.

It also uses CloudFormation from services to set parameters on other services.
For example, the `auth` service publishes the CloudFormation Output
`AuthApiUrl`, which is used by the website service.

```yaml
web:
  path: ./website
  params:
    authApiUrl: ${auth.AuthApiUrl}
```

Using Serverless Compose also allows you to deploy all services with a single
command, `serverless deploy`.

## Authentication SDK Library

The `auth` service contains a shared client library that is used by the other
services to validate the JWT token. This library is defined as an NPM package
and is used by the `ai-chat-api` and `business-api` services and included using
relative paths in the `package.json` file.

## Authentication (api.awsaistack.com/auth)

The `auth` service is an Express.js-based API service that provides login and
registration endpoints. It uses a DynamoDB table to store user information and
uses JWT tokens for authentication.

Upon login or registration, the service returns a JWT token. These APIs are used
by the website service to authenticate users. The token is stored in
localstorage and is used to authenticate requests to the `ai-chat-api` and
`business-api` services.

The `ai-chat-api` service uses AWS Lambda Function URLs instead of API Gateway,
in order to support streaming responses. As such, it uses the `Auth` class from
`auth-sdk` to validate the JWT token, instead of using an API Gateway
authorizer.

The `auth` service also publishes the CloudFormation Output `AuthApiUrl`, which
is used by the website service to make requests to the `auth` service.

## AI Chat (chat.awsaistack.com)

In most cases APIs on AWS Lambda use the API Gateway to expose the API. However,
the `ai-chat-api` service uses Lambda Function URLs instead of API Gateway, in
order to support streaming responses as streaming responses are not supported by
API Gateway.

Since the `ai-chat-api` service does not use API Gateway, it does not support
custom domain names natively. Instead, it uses a CloudFront Distribution to
support a custom domain name.

To provide the AI Chat functionality, the service uses the AWS Bedrock Models
service to interact with the AI Chat bot. The requests from the frontend (via
the API) are sent to the AWS Bedrock Models service, and the streaming response
from Bedrock is sent back to the frontend via the streaming response.

The AWS Bedrock AI Model is selected using the `modelId` parameter in the
`ai-chat-api/serverless.yml` file.

```
stages:
  default:
    params:
      modelId: meta.llama3-70b-instruct-v1:0
```

The AI Chat service also implements a simple throttling schema to limit cost
exposure when using AWS Bedrock. It implements a monthly limit for the number
of requests per user and a global monthly limit for all users. It uses a
DynamoDB Table to persist the request counts and other AI usage metrics.

The inline comments provider more details on this mechanism as well as ways to
customize it to use other metrics, like token usage.

```
stages:
  default:
    params:
      throttleMonthlyLimitUser: 10
      throttleMonthlyLimitGlobal: 100
```

## Website (awsaistack.com)

The website service is a simple Lambda function which uses Express to serve
static assets. The service uses the `serverless-plugin-scripts` plugin to
run the `npm run build` command to build the website before deploying.

The build command uses the parameters to set the `REACT_APP_*` environment
variables, which are used in the React app to configure the API URLs.

The frontend website is built using React. It uses the `auth` service to
login and register uses, and uses the `ai-chat-api` to interact with the
AI Chat bot API.

## Business API (api.awsaistack.com/business)

This is an Express.js-based API service that provides a placeholder for your
business logic. It is configured to use the same custom domain name as the
`auth` service, but with a different base path (`/business`).

The endpoints are protected using the `express-jwt` middleware, which uses the
JWT token provided by the `auth` service to authenticate the user.

## Business Worker

This is a placeholder function for your business logic for processing
asynchronous events. It subscribes to events on the EventBridge and processes
the events.

Currently this subscribes to the `auth.register` event, which is published by
the `auth` service when a user registers.

Both the Business Worker and the Auth service therefore depend on the
EventBridge which is provisioned in the `event-bus` service.

## Custom Domain Name

The services which use API Gateway use the `serverless-domain-manager` plugin to
setup the custom domain name. More details about the plugin can be found on the
[serverless-domain-manager plugin page](https://www.serverless.com/plugins/serverless-domain-manager).

The `api-ai-chat` service uses Lambda Function URLs instead of API Gateway, so
custom domain name is supported by creating a CloudFront Distribution with the
custom domain name and the Lambda Function URL as the origin.

The `business-api` and `auth` APIs both use the same custom domain name. Instead
of sharing an API Gateway, they are configured to use the same domain name
with different base paths, one for each service.

# API Usage

Below are a few simple API requests using the `curl` command.

## User Registration API

```
curl -X POST https://api.awsaistack.com/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email": "me@example.com", "password": "password"}'
```

## User Login API

```
curl -X POST https://api.awsaistack.com/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "me@example.com", "password": "password"}'
```

If you have `jq` installed, you can wrap the login request in a command to set
the token as an environment variable so you can use the token in subsequent
requests.

```
export SERVERLESS_EXAMPLE_TOKEN=$(curl -X POST https://api.awsaistack.com/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "me@example.com", "password": "password"}' \
| jq -r '.token')
```

## Chat API

You can also use the Chat API directly; however, the response payload is a
a stream of JSON objects containing the response and other metadata. Each buffer
may also contain multiple JSON objects.

This endpoint is authenticated and requires the JWT token from the login API.

```
curl -N -X POST https://chat.awsaistack.com/ \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $SERVERLESS_EXAMPLE_TOKEN" \
  -d '[{"role":"user","content":[{"text":"What makes the serverless framework so great?"}]}]'
```

## Business Logic API

This endpoint is also authenticated and requires the JWT token from the login
API. The response is a simple message.

```
curl -X GET https://api.awsaistack.com/business/ \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $SERVERLESS_EXAMPLE_TOKEN"
```

# Alternative Design Considerations

## Sharing Domain Name between CloudFront and API Gateway

The Chat API uses CloudFront Distributions to add support for custom domain
names to the AWS Lambda Function URL, as it is not natively supported.
The Auth & Business APIs on the other hand use API Gateway which supports
custom domain names natively. However, an API Gateway and a CloudFront
Distribution do not support using the same hostname as they both require a CNAME
record.

For these two services to share the same domain name, consider using the
CloudFront distribution to proxy the API Gateway requests. This would allow
both services to use the same domain name, and would also allow the Chat API
to use the same domain name as the other services.

## Using API Gateway to share a custom domain name

In this configuration, the Auth and Business APIs use the paths `/auth` and
`/business` respectively on `api.awsaistack.com`. The Custom Domain
Name Path Mapping was used in the Custom Domain Name support in API Gateway
to use the same domain name but shared across multiple API Gateway instances.

Alternatively, you you can use a single API Gateway and map the paths to the
respective services. This would allow you to use the same domain name for
multiple services, and would also allow you to use the same authorizer for
all the services. However, sharing an API Gateway instance may have performance
implications at scale, which is why this example uses separate API Gateway
instances for each service.

## Schema validation

The `auth`, `business-api`, and `chat-api` all validate the user input, and in
the case of `chat-api` use Zod to validate the schema. Consider including
schema validation on all API requests using a library like Zod, and/or
Express.js middleware.

## Static website hosting

This example, for simplicity, hosts the static assets from an AWS Lambda
Function. This is not recommended for production, and you should consider
using a static website hosting service like S3 or CloudFront to host your
website. Consider using one of the following plugins to deploy your website:

- [serverless-finch](https://www.serverless.com/plugins/serverless-finch)
- [Lift Website Component](https://www.serverless.com/plugins/serverless-lift#single-page-app)

## Using Lambda Authorizers

This example uses a custom authorization method using JWT tokens for the
`ai-chat-api` service, which doesn't use API Gateway.

The `business-api` is based on Express.js and uses the `authMiddleware` method
in the `auth-sdk` to validate the JWT token.

API Gateway supports Lambda Authorizers which can be used to validate JWT tokens
before the request is passed to the Lambda Function. This is a more robust
solution than the custom method used in this example, and should be considered
for production services. This method will not work for the `ai-chat-api` service
as it does not use API Gateway.

## Deploying with CI/CD

Using Github Actions this example deploys all the services using Serverless
Compose. This ensures that any changes to the individual services or the
`serverless-compose.yml` will reevaluate the interdependent parameters. However,
all services are redeployed on any change in the repo, which may not be
necessary.

Consider using a more fine-grained approach to deploying services, such as
only deploying the services that have changed by using the `serverless <service>
deploy` command.

##
