require "test_helper"

class Legacy::MysqlDumpReaderTest < ActiveSupport::TestCase
  test "reads the rows of each table by column name" do
    tables = Legacy::MysqlDumpReader.read(file_fixture("legacy_dump.sql"))

    assert_equal %w[addresses people], tables.keys.sort
    assert_equal 3, tables["addresses"].size
    assert_equal 8, tables["people"].size

    ann = tables["people"].first
    assert_equal({ "id" => 1, "lastName" => "O'Neill", "firstName" => "Ann", "address_id" => 1, "parent_id" => nil,
                   "spouse_id" => 2, "created_at" => "2015-03-01 10:00:00", "updated_at" => "2015-03-01 10:00:00",
                   "suffix" => "" }, ann)
    assert_equal "Zoë", tables["people"][4]["firstName"]
    assert_equal %(Gate code's 12, "ring twice"), tables["addresses"][0]["comments"]
  end

  test "reads inserts that name their columns, numbers and doubled quotes" do
    sql = <<~SQL
      INSERT INTO `t` (`a`, `b`, `c`) VALUES (1,'it''s',-2.5),(2,'a\\nb',NULL);
    SQL

    rows = Legacy::MysqlDumpReader.new(sql).tables["t"]

    assert_equal [ { "a" => 1, "b" => "it's", "c" => -2.5 }, { "a" => 2, "b" => "a\nb", "c" => nil } ], rows
  end

  test "rejects rows that don't fit the table" do
    sql = "CREATE TABLE `t` (\n  `a` int,\n  `b` int\n);\nINSERT INTO `t` VALUES (1);\n"

    assert_raises(Legacy::MysqlDumpReader::ParseError) { Legacy::MysqlDumpReader.new(sql).tables }
  end

  test "rejects an unterminated string" do
    sql = "INSERT INTO `t` (`a`) VALUES ('oops);\n"

    assert_raises(Legacy::MysqlDumpReader::ParseError) { Legacy::MysqlDumpReader.new(sql).tables }
  end
end
