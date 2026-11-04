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

echo "== Building the client"
cd "$ROOT/client"
npm ci
npx ng build --configuration production
DIST="$ROOT/client/dist/addressbook/browser"

echo "== Uploading to s3://$BUCKET"
# Built files have content hashes in their names, so browsers can cache them
# for a year. index.html is not hashed, so it must always be re-checked.
aws s3 sync "$DIST" "s3://$BUCKET" --region "$REGION" --delete \
  --exclude index.html --cache-control "public, max-age=31536000, immutable"
aws s3 cp "$DIST/index.html" "s3://$BUCKET/index.html" --region "$REGION" \
  --cache-control "no-cache"

echo "== Clearing CloudFront's copy of index.html"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION" \
  --paths "/index.html" "/" --query "Invalidation.Id" --output text

echo "== Done: $SITE_URL"
