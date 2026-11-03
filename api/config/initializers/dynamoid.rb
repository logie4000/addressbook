# Amazon DynamoDB settings, read from the environment.
#
#   DYNAMODB_ENDPOINT      Point at DynamoDB Local (e.g. http://localhost:8000)
#                          for development and tests. Leave unset on AWS.
#   DYNAMODB_TABLE_PREFIX  Prefix for table names. Defaults to
#                          "addressbook_<rails env>", giving tables such as
#                          "addressbook_production_people".
#   AWS_REGION             AWS region. Set automatically inside Lambda.
#
# On AWS the credentials come from the Lambda's IAM role, so no keys are set
# here. DynamoDB Local ignores credentials (but rejects some key formats), so
# fixed dummy ones are used whenever an endpoint is given.
Dynamoid.configure do |config|
  config.namespace = ENV.fetch("DYNAMODB_TABLE_PREFIX", "addressbook_#{Rails.env}")
  config.region = ENV.fetch("AWS_REGION", "us-east-1")

  if ENV["DYNAMODB_ENDPOINT"].present?
    config.endpoint = ENV["DYNAMODB_ENDPOINT"]
    config.access_key = "local"
    config.secret_key = "local"
  end

  # Tables are created ahead of time: by `bin/rails dynamodb:create_tables`
  # locally, and by the infrastructure template on AWS. Never create them
  # implicitly on first write.
  config.create_table_on_save = false

  # On-demand billing: pay per request, nothing while idle.
  config.capacity_mode = :on_demand

  # The list endpoints read the whole (small) table with a Scan on purpose,
  # so don't log a warning every time.
  config.warn_on_scan = false

  # Store timestamps as ISO 8601 strings so they are readable in the AWS console.
  config.store_datetime_as_string = true
  config.store_date_as_string = true
end
