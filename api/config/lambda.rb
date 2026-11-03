# Entry point for AWS Lambda. The Lambda function's handler is set to
# "config/lambda.Lamby.cmd": Lambda loads this file once per cold start, then
# calls Lamby.cmd for each request. Lamby turns the API Gateway event into a
# Rack request, runs it through Rails, and turns the Rack response back into
# what API Gateway expects.

# Rails needs a secret_key_base in production. Rather than baking it into the
# image or the template, it lives in SSM Parameter Store as a SecureString, and
# the template passes its name in SECRET_KEY_BASE_PARAMETER.
if ENV["SECRET_KEY_BASE"].to_s.empty? && !ENV["SECRET_KEY_BASE_PARAMETER"].to_s.empty?
  require "aws-sdk-ssm"
  ENV["SECRET_KEY_BASE"] = Aws::SSM::Client.new
    .get_parameter(name: ENV["SECRET_KEY_BASE_PARAMETER"], with_decryption: true)
    .parameter.value
end

require_relative "environment"

# Lamby is required here rather than through the Gemfile because it installs
# signal handlers that would change Ctrl-C behavior in development.
require "lamby"
