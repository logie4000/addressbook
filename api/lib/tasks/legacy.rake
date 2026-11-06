# One-time move of the old MariaDB address book into DynamoDB.
# See docs/migrate-mariadb.md for the full walkthrough.
#
#   bin/rails "legacy:import[legacy.sql]" DRY_RUN=1   # report only, writes nothing
#   bin/rails "legacy:import[legacy.sql]"             # write (DynamoDB Local)
#   bin/rails "legacy:verify[legacy.sql]"             # re-check what was written
#   bin/rails "legacy:rollback[legacy.sql]"           # delete what it wrote
#
# Options (environment variables):
#   SKIP=11,12,248   old people ids to leave out (e.g. placeholder rows)
#   CONFIRM=<prefix> required to write to real AWS tables: the table prefix,
#                    e.g. addressbook_production
#   OVERWRITE=1      write even though the tables hold records the dump
#                    didn't create (they are kept, not deleted)
namespace :legacy do
  def legacy_importer(args)
    path = args[:dump] or abort "Give the dump file: bin/rails \"legacy:import[path/to/dump.sql]\""
    abort "No such file: #{path}" unless File.exist?(path)

    tables = Legacy::MysqlDumpReader.read(path)
    Legacy::MariadbImporter.new(tables, skip: ENV.fetch("SKIP", "").split(",").map(&:strip).reject(&:empty?))
  end

  # Writing to real AWS tables (no DynamoDB Local endpoint) needs CONFIRM set
  # to the table prefix, so a stray command can't touch production.
  def legacy_guard!(action)
    prefix = Dynamoid.config.namespace
    target = ENV["DYNAMODB_ENDPOINT"].present? ? "DynamoDB Local (#{ENV['DYNAMODB_ENDPOINT']})" : "AWS #{Dynamoid.config.region}"
    puts "Target: #{target}, tables #{prefix}_addresses and #{prefix}_people"

    if ENV["DYNAMODB_ENDPOINT"].blank? && ENV["CONFIRM"] != prefix
      abort "Refusing to #{action} real AWS tables. Run again with CONFIRM=#{prefix} if this is intended."
    end
  end

  desc "Import the old MariaDB dump into DynamoDB (DRY_RUN=1 to only report)"
  task :import, [ :dump ] => :environment do |_task, args|
    importer = legacy_importer(args)
    puts importer.report
    puts
    puts "Dump holds #{importer.counts[:addresses]} addresses and #{importer.counts[:people]} people."

    if ENV["DRY_RUN"].present?
      puts "Dry run: nothing written."
      next
    end

    legacy_guard!("write to")
    others = importer.foreign_ids
    if others.any? && ENV["OVERWRITE"].blank?
      abort "The tables already hold #{others.size} records that didn't come from this dump. " \
            "Run again with OVERWRITE=1 to import alongside them."
    end

    importer.write!
    problems = importer.verify
    if problems.empty?
      puts "Imported and verified #{importer.counts[:addresses]} addresses and #{importer.counts[:people]} people."
    else
      abort "Imported, but verification found #{problems.size} problems:\n" + problems.first(20).join("\n")
    end
  end

  desc "Check the imported records against the dump"
  task :verify, [ :dump ] => :environment do |_task, args|
    problems = legacy_importer(args).verify
    abort "#{problems.size} problems:\n" + problems.first(50).join("\n") if problems.any?
    puts "All records match the dump."
  end

  desc "Delete the records the dump import created (and nothing else)"
  task :rollback, [ :dump ] => :environment do |_task, args|
    importer = legacy_importer(args)
    legacy_guard!("delete from")
    importer.rollback!
    puts "Deleted #{importer.counts[:addresses]} addresses and #{importer.counts[:people]} people created by the import."
  end
end
