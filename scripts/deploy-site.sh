#!/usr/bin/env bash
# Builds the Angular client and publishes it to the S3 bucket behind CloudFront.
# Run from anywhere after `sam deploy` has created the stack:
#
#   scripts/deploy-site.sh                 # stack "addressbook-production"
#   STACK_NAME=addressbook-staging scripts/deploy-site.sh
#
# Needs the AWS CLI (signed in), Node.js and npm.
set -euo pipefail

STACK_NAME="${STACK_NAME:-addressbook-production}"
REGION="${AWS_REGION:-us-east-1}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

output() {
  aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}

BUCKET="$(output SiteBucketName)"
DISTRIBUTION="$(output DistributionId)"
SITE_URL="$(output SiteUrl)"
USER_POOL_ID="$(output UserPoolId)"
CLIENT_ID="$(output UserPoolClientId)"
COGNITO_DOMAIN="$(output CognitoDomain)"

echo "== Building the client"
cd "$ROOT/client"
npm ci
npx ng build --configuration production
DIST="$ROOT/client/dist/addressbook/browser"

# The app reads its sign-in settings from config.json at startup, so nothing
# account-specific is compiled into it.
cat > "$DIST/config.json" <<JSON
{
  "auth": {
    "region": "$REGION",
    "userPoolId": "$USER_POOL_ID",
    "clientId": "$CLIENT_ID",
    "domain": "$COGNITO_DOMAIN"
  }
}
JSON

echo "== Uploading to s3://$BUCKET"
# Built files have content hashes in their names, so browsers can cache them
# for a year. index.html and config.json are not, so they must always be
# re-checked.
aws s3 sync "$DIST" "s3://$BUCKET" --region "$REGION" --delete \
  --exclude index.html --exclude config.json \
  --cache-control "public, max-age=31536000, immutable"
for file in index.html config.json; do
  aws s3 cp "$DIST/$file" "s3://$BUCKET/$file" --region "$REGION" \
    --cache-control "no-cache"
done

echo "== Clearing CloudFront's copy of index.html and config.json"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION" \
  --paths "/index.html" "/" "/config.json" --query "Invalidation.Id" --output text

echo "== Done: $SITE_URL"
