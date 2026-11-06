namespace :dynamodb do
  desc "Create the DynamoDB tables (and their indexes) for every model, if missing"
  task create_tables: :environment do
    Rails.application.eager_load!

    Dynamoid.included_models.each do |model|
      if Dynamoid.adapter.list_tables.include?(model.table_name)
        puts "exists:  #{model.table_name}"
      else
        model.create_table(sync: true)
        puts "created: #{model.table_name}"
      end
    end
  end

  desc "Fill empty local tables with sample data from db/seeds.rb"
  task seed: :create_tables do
    abort "Refusing to load sample data in production" if Rails.env.production?

    if Person.first || Address.first
      puts "skipped: the tables already have data (run dynamodb:reset to start over)"
    else
      load Rails.root.join("db/seeds.rb")
    end
  end

  desc "Delete, recreate and reseed the local tables"
  task reset: [ :drop_tables, :seed ]

  desc "Delete the DynamoDB tables for every model (local use only)"
  task drop_tables: :environment do
    abort "Refusing to drop tables in production" if Rails.env.production?

    Rails.application.eager_load!

    Dynamoid.included_models.each do |model|
      next unless Dynamoid.adapter.list_tables.include?(model.table_name)

      model.delete_table
      puts "deleted: #{model.table_name}"
    end
  end
end
