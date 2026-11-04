# Deploying the API to AWS

The API runs as a single AWS Lambda function behind an API Gateway HTTP API,
with its data in DynamoDB. Everything is described in
[`template.yaml`](../template.yaml) and deployed with the AWS SAM CLI.

## What gets created

| Resource | What it is | Cost at address-book scale |
|----------|------------|----------------------------|
| `addressbook-api-production` (Lambda) | Rails, packaged as a container image by `api/Dockerfile.lambda`. Runs only while handling a request. | Free tier: 1M requests and 400,000 GB-seconds a month, always free |
| HTTP API (API Gateway) | Public HTTPS endpoint that passes every request to the function | $1 per million requests |
| `addressbook_production_people`, `addressbook_production_addresses` (DynamoDB) | The data, billed per request | Free tier: 25 GB storage, always free |
| ECR repository | Stores the container image (created by SAM) | About $0.10 per GB a month, so a few cents |
| CloudWatch log group | Function logs, kept 14 days | Pennies |
| SSM parameter | Rails' `secret_key_base` | Free (standard parameter) |

The DynamoDB tables are set to **Retain**: deleting the stack leaves your data
in place.

## One-time setup

1. **Install the tools** on your computer:
   [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html),
   [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html),
   and Docker (SAM uses it to build the image).

2. **Sign the CLI in to your account.** Use an IAM user or IAM Identity Center
   user with administrator access, not the root user:

   ```sh
   aws configure          # or: aws configure sso
   aws sts get-caller-identity   # confirms who you are signed in as
   ```

3. **Create the Rails secret.** Rails needs a random `secret_key_base` in
   production. It is stored encrypted in SSM Parameter Store, and the function
   reads it when it starts:

   ```sh
   aws ssm put-parameter --region us-east-1 \
     --name /addressbook/production/SECRET_KEY_BASE \
     --type SecureString \
     --value "$(openssl rand -hex 64)"
   ```

## Deploying

From the repository root:

```sh
sam build     # builds the container image with Docker
sam deploy    # uploads it and creates or updates the stack
```

`sam deploy` shows the list of changes and asks you to confirm. The first
deploy takes a few minutes. When it finishes it prints the **ApiUrl** output.

Settings such as the region (`us-east-1`) and stack name live in
[`samconfig.toml`](../samconfig.toml).

> **Apple Silicon Macs:** the template builds an `x86_64` image, which Docker
> builds under emulation (slowly). If that's your machine, change
> `Architectures` in `template.yaml` to `arm64`. It also runs about 20%
> cheaper on Lambda.

## Trying it out

```sh
API=https://<id>.execute-api.us-east-1.amazonaws.com   # the ApiUrl output

curl $API/up
curl -X POST $API/api/v1/people -H 'Content-Type: application/json' \
  -d '{"person": {"firstName": "Ann", "lastName": "Example",
       "address_attributes": {"street1": "1 Main St", "city": "Springfield"}}}'
curl $API/api/v1/people
curl $API/api/v1/addresses
```

The first request after a quiet spell takes a few seconds while Lambda starts
Rails (a "cold start"). Requests after that are fast.

The API is open to anyone with the URL until login is added (step 4 of the
plan), so don't load real data yet.

## Watching logs

```sh
sam logs --stack-name addressbook-production -n ApiFunction --tail
```

Or open CloudWatch → Log groups → `/aws/lambda/addressbook-api-production`
in the AWS console.

## Removing it

```sh
sam delete --stack-name addressbook-production
```

This removes the function, API and logs. The two DynamoDB tables and the SSM
parameter stay behind; delete them in the console if you no longer want them.
