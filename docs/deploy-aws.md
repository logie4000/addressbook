# Deploying the address book to AWS

The Angular site is a set of files in a private S3 bucket, served by
CloudFront. The API runs as a single AWS Lambda function behind an API Gateway
HTTP API, with its data in DynamoDB. CloudFront puts both on one domain:
requests under `/api/` go to the API and everything else to the site, so the
browser never makes a cross-site request.

Everything is described in [`template.yaml`](../template.yaml) and deployed
with the AWS SAM CLI. The site's files are published separately with
[`scripts/deploy-site.sh`](../scripts/deploy-site.sh).

## What gets created

| Resource | What it is | Cost at address-book scale |
|----------|------------|----------------------------|
| `addressbook-api-production` (Lambda) | Rails, packaged as a container image by `api/Dockerfile.lambda`. Runs only while handling a request. | Free tier: 1M requests and 400,000 GB-seconds a month, always free |
| HTTP API (API Gateway) | Public HTTPS endpoint that passes every request to the function | $1 per million requests |
| `addressbook_production_people`, `addressbook_production_addresses` (DynamoDB) | The data, billed per request | Free tier: 25 GB storage, always free |
| ECR repository | Stores the container image (created by SAM) | About $0.10 per GB a month, so a few cents |
| CloudWatch log group | Function logs, kept 14 days | Pennies |
| SSM parameter | Rails' `secret_key_base` | Free (standard parameter) |
| S3 bucket | The built Angular files. Private: only CloudFront can read it. | A few cents |
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

## Trying it out

Open **SiteUrl** (`https://<something>.cloudfront.net`) in a browser.

To exercise the API directly:

```sh
API=https://<something>.cloudfront.net   # SiteUrl; ApiUrl works too

curl $API/up
curl -X POST $API/api/v1/people -H 'Content-Type: application/json' \
  -d '{"person": {"firstName": "Ann", "lastName": "Example",
       "address_attributes": {"street1": "1 Main St", "city": "Springfield"}}}'
curl $API/api/v1/people
curl $API/api/v1/addresses
```

The first request after a quiet spell takes a few seconds while Lambda starts
Rails (a "cold start"). Requests after that are fast.

The site and API are open to anyone with the URL until login is added (step
4 of the plan), so don't load real data yet.

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
DynamoDB tables, the S3 bucket and the SSM parameter stay behind; delete them
in the console if you no longer want them.
