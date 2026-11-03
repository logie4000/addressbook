ENV["RAILS_ENV"] ||= "test"
# Tests run against DynamoDB Local (see the README). Override to point elsewhere.
ENV["DYNAMODB_ENDPOINT"] ||= "http://localhost:8000"

require_relative "../config/environment"
require "rails/test_help"

# Create the test tables once per run, if they don't exist yet.
Rails.application.eager_load!
existing_tables = Dynamoid.adapter.list_tables
Dynamoid.included_models.each do |model|
  model.create_table(sync: true) unless existing_tables.include?(model.table_name)
end

module ActiveSupport
  class TestCase
    # The tests share one set of DynamoDB tables, so run them one at a time.
    parallelize(workers: 1)

    # Start every test with empty tables.
    setup do
      Dynamoid.included_models.each do |model|
        model.all.each(&:delete)
      end
    end
  end
end
