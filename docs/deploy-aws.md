# Deploying the address book to AWS

The Angular site is a set of files in a private S3 bucket, served by
CloudFront. The API runs as a single AWS Lambda function behind an API Gateway
HTTP API, with its data in DynamoDB. Signing in goes through Amazon Cognito,
and the API rejects any request without a valid sign-in token. CloudFront puts both on one domain:
requests under `/api/` go to the API and everything else to the site, so the
browser never makes a cross-site request.

Everything is described in [`template.yaml`](../template.yaml) and deployed
with the AWS SAM CLI. The site's files are published separately with
[`scripts/deploy-site.sh`](../scripts/deploy-site.sh).

## What gets created

| Resource | What it is | Cost at address-book scale |
|----------|------------|----------------------------|
| `addressbook-api-production` (Lambda) | Rails, packaged as a container image by `api/Dockerfile.lambda`. Runs only while handling a request. | Free tier: 1M requests and 400,000 GB-seconds a month, always free |
| HTTP API (API Gateway) | HTTPS endpoint that checks the Cognito sign-in token, then passes the request to the function | $1 per million requests |
| `addressbook_production_people`, `addressbook_production_addresses` (DynamoDB) | The data, billed per request | Free tier: 25 GB storage, always free |
| ECR repository | Stores the container image (created by SAM) | About $0.10 per GB a month, so a few cents |
| CloudWatch log group | Function logs, kept 14 days | Pennies |
| SSM parameter | Rails' `secret_key_base` | Free (standard parameter) |
| S3 bucket | The built Angular files. Private: only CloudFront can read it. | A few cents |
| Cognito user pool | Sign-in accounts and the hosted sign-in page | Lite tier: free up to 10,000 monthly active users, including Google sign-ins |
| `addressbook-pre-sign-up-production` (Lambda, only with Google sign-in) | Links a first Google sign-in to the account you created | Free tier |
| CloudFront distribution | HTTPS front door for the site and the API, with a small function that sends Angular routes to `index.html` | Free tier: 1 TB and 10M requests a month, always free |

The DynamoDB tables and the S3 bucket are set to **Retain**: deleting the
stack leaves your data and files in place.

## One-time setup

1. **Install the tools** on your computer:
   [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html),
   [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html),
   Docker (SAM uses it to build the image), and Node.js 22 (to build the
   site).

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
deploy takes a few minutes (a new CloudFront distribution can take up to 15).
When it finishes it prints the stack's outputs, including **SiteUrl** and
**ApiUrl**.

Then publish the website:

```sh
scripts/deploy-site.sh
```

It builds the Angular app, uploads it to the bucket, and clears CloudFront's
cached copy of `index.html`. Run `sam deploy` again only when the template or
the API changes, and `scripts/deploy-site.sh` whenever the client changes.

Settings such as the region (`us-east-1`) and stack name live in
[`samconfig.toml`](../samconfig.toml).

> **Apple Silicon Macs:** the template builds an `x86_64` image, which Docker
> builds under emulation (slowly). If that's your machine, change
> `Architectures` in `template.yaml` to `arm64`. It also runs about 20%
> cheaper on Lambda.

## Automatic deploys from GitHub

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) deploys
`main` by itself once all the CI checks pass on it: `sam build`, then
`sam deploy`, then `scripts/deploy-site.sh`, the same steps as above. Deploys
run one at a time; if several merges land close together, only the newest
commit is deployed. You can also start one by hand under **Actions > Deploy >
Run workflow**.

Each successful deploy tags the commit it put live: a permanent
`deploy-<date>-<run number>` tag (for example `deploy-2026-11-28-5`), and a
`production` tag that always points at what is live now. See them under the
repository's **Tags**, or run `git fetch --tags --force` and
`git log -1 production`.

No AWS keys are stored in GitHub. Each run gets a short-lived token from
GitHub, and AWS trades it for temporary credentials for the
`addressbook-github-deploy` role, but only for jobs in this repository's
`production` environment. That role can update the stack and publish the
site; CloudFormation makes the actual changes using a second role,
`addressbook-cloudformation-deploy`. Both are defined in
[`deploy/github-deploy-role.yaml`](../deploy/github-deploy-role.yaml).

Things to know:

- **Every merge goes live.** That includes Dependabot's minor and patch
  updates, which merge themselves once CI passes. To check each deploy
  first, turn on **Required reviewers** in step 2 below; GitHub then emails
  you and waits for a click before deploying.
- **Undoing a bad deploy:** open the merged pull request on GitHub, click
  **Revert**, and merge the pull request it creates. That deploys the
  previous version. Data in DynamoDB is not rolled back.
- **The deploy role is powerful.** Anything that can update a stack which
  creates IAM roles could, in principle, give itself more access in your
  account. What keeps it safe is that only `main`, through the `production`
  environment, can use it, which is why step 2 matters.

### One-time setup

1. **Create the two roles** (and GitHub's sign-in provider), from the
   repository root with your administrator credentials. First check whether
   the account already has a GitHub provider:

   ```sh
   aws iam list-open-id-connect-providers
   ```

   If the output does **not** mention `token.actions.githubusercontent.com`:

   ```sh
   aws cloudformation deploy --region us-east-1 --stack-name addressbook-github-deploy --template-file deploy/github-deploy-role.yaml --capabilities CAPABILITY_NAMED_IAM
   ```

   If it does, add `--parameter-overrides CreateOidcProvider=false` to the end
   of that command.

2. **Create the `production` environment** in GitHub: the repository's
   **Settings > Environments > New environment**, name it `production`, and
   click **Configure environment**. Then:
   - Under **Deployment branches and tags**, choose **Selected branches and
     tags**, click **Add deployment branch or tag rule**, type `main`, and
     click **Add rule**. Don't skip this: it is what stops any other branch
     from deploying.
   - Optional: tick **Required reviewers**, add yourself, and click **Save
     protection rules**, to approve each deploy before it runs.

   Create it before merging the workflow. If GitHub creates it on the first
   run instead, it has no rules.

After that, every merge to `main` deploys by itself. Watch it under
**Actions > Deploy**.

Deploying from your own computer still works as before (`sam build`, then
`sam deploy`, then `scripts/deploy-site.sh`). CloudFormation now remembers the
`addressbook-cloudformation-deploy` role and uses it for your deploys too, so
a new kind of resource in `template.yaml` may also need adding to that role.

## Signing in

Only people you create accounts for can use the address book; there is no
public sign-up. Accounts live in a Cognito user pool (the **UserPoolId**
output). Cognito's Lite tier is free for up to 10,000 active users a month.

**Create an account** (Cognito emails a temporary password):

```sh
POOL=$(aws cloudformation describe-stacks --region us-east-1 --stack-name addressbook-production \
  --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)

aws cognito-idp admin-create-user --region us-east-1 --user-pool-id "$POOL" \
  --username you@example.com \
  --user-attributes Name=email,Value=you@example.com Name=email_verified,Value=true
```

Then open **SiteUrl**. The app sends you to Cognito's sign-in page. Sign in
with the temporary password and choose a new one (at least 12 characters,
with upper and lower case letters and a number). You come back to the address
book signed in, and a **Sign out** button appears at the top right.

You can also manage accounts in the AWS console under Cognito → User pools →
`addressbook-production`.

## Signing in with Google

You can add a **Continue with Google** button to the sign-in page. It's still
invite-only: a Google account can sign in only if you've already created an
account (as above) for the same email address. The first time someone uses
Google, it's linked to that account, so they keep one account whichever way
they sign in. Anyone else sees "This Google account has not been invited to
the address book."

1. **Create a Google OAuth client.** In the
   [Google Cloud console](https://console.cloud.google.com/), create a project
   (or pick one), then:
   - **APIs & Services → OAuth consent screen:** choose **External**, give
     the app a name and your email, and add the scopes `openid`, `email` and
     `profile`. Then **Publish app**, or while it's in "Testing" only the test
     users you list can sign in. These basic scopes don't need Google's review.
   - **APIs & Services → Credentials → Create credentials → OAuth client ID:**
     type **Web application**. Under **Authorized JavaScript origins** add
     `https://<CognitoDomain>`, and under **Authorized redirect URIs** add
     `https://<CognitoDomain>/oauth2/idpresponse`, where `<CognitoDomain>` is
     the stack output of that name
     (`addressbook-production-<account id>.auth.us-east-1.amazoncognito.com`).

   Google shows a **client ID** and a **client secret**.

2. **Store the client secret** in Parameter Store:

   ```sh
   aws ssm put-parameter --region us-east-1 \
     --name /addressbook/production/GOOGLE_CLIENT_SECRET \
     --type String --value "<client secret>"
   ```

   It has to be a plain `String`, not a `SecureString`: CloudFormation can
   only read `SecureString` parameters for a few resource types, and Cognito's
   isn't one of them. The parameter is still private to your account, and
   storing it is free.

3. **Turn it on.** Add the client ID to `parameter_overrides` in
   `samconfig.toml`:

   ```toml
   parameter_overrides = "... GoogleClientId=\"1234-abc.apps.googleusercontent.com\""
   ```

   then run `sam build` and `sam deploy`. (The build step is needed this time,
   for the small function that links Google logins to accounts.)

The sign-in page now shows **Continue with Google**. Someone's very first
Google sign-in goes round the sign-in page twice, because Cognito asks for a
second try after linking the accounts; the app does that for them.

## Trying it out

Open **SiteUrl** (`https://<something>.cloudfront.net`) in a browser and sign
in.

The API itself only answers requests that carry a valid sign-in token, so
from the command line only the health check works:

```sh
curl https://<something>.cloudfront.net/up                 # 200
curl https://<something>.cloudfront.net/api/v1/people      # 401 Unauthorized
```

The first request after a quiet spell takes a few seconds while Lambda starts
Rails (a "cold start"). Requests after that are fast.

## Using your own subdomain

The site works on its `cloudfront.net` address straight away. To serve it at,
say, `addressbook.example.com` while your DNS stays at Squarespace:

1. **Request a certificate** in `us-east-1` (CloudFront only uses
   certificates from that region). It's free:

   ```sh
   aws acm request-certificate --region us-east-1 \
     --domain-name addressbook.example.com --validation-method DNS
   aws acm describe-certificate --region us-east-1 --certificate-arn <arn from above> \
     --query "Certificate.DomainValidationOptions[0].ResourceRecord"
   ```

2. **Prove you own the domain:** in Squarespace's DNS settings, add the CNAME
   record that the second command printed (its Name and Value). Within about
   half an hour the certificate's status becomes `ISSUED`:

   ```sh
   aws acm describe-certificate --region us-east-1 --certificate-arn <arn> \
     --query Certificate.Status
   ```

3. **Tell the stack about it.** In `samconfig.toml`, add the domain and
   certificate to `parameter_overrides`:

   ```toml
   parameter_overrides = "StageName=\"production\" SecretKeyBaseParameter=\"/addressbook/production/SECRET_KEY_BASE\" DomainName=\"addressbook.example.com\" CertificateArn=\"arn:aws:acm:us-east-1:...\""
   ```

   then run `sam deploy`.

4. **Point the subdomain at CloudFront:** in Squarespace, add a CNAME record
   with host `addressbook` and the **DistributionDomainName** output
   (`<something>.cloudfront.net`) as its value.

Leave both CNAME records in place: ACM uses the first to renew the certificate
automatically.

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

This removes the function, API, CloudFront distribution and logs. The two
DynamoDB tables, the S3 bucket, the Cognito user pool and the SSM parameter
stay behind; delete them in the console if you no longer want them.
