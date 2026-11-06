require "test_helper"

class Legacy::MariadbImporterTest < ActiveSupport::TestCase
  def importer(skip: [])
    Legacy::MariadbImporter.new(Legacy::MysqlDumpReader.read(file_fixture("legacy_dump.sql")), skip: skip)
  end

  def person(old_id) = Person.find(Legacy::MariadbImporter.person_id(old_id))
  def address(old_id) = Address.find(Legacy::MariadbImporter.address_id(old_id))

  test "ids are derived from the old ids and stay the same" do
    assert_equal Legacy::MariadbImporter.person_id(1), Legacy::MariadbImporter.person_id(1)
    refute_equal Legacy::MariadbImporter.person_id(1), Legacy::MariadbImporter.address_id(1)
  end

  test "imports each household whole, the way the app saves one" do
    importer.write!

    assert_equal 3, Address.count
    assert_equal 7, Person.count

    home = address(1)
    assert_equal "Ann", home.addressee.firstName
    assert_equal "Bob", home.spouse.firstName
    assert_equal home.addressee_id, person(2).spouse_id, "spouse link made two-way"
    assert_equal %w[Cara Child\ 2], home.addressee.children.map(&:firstName).sort, "spouse's child moved to the addressee"
    assert_equal [ "O'Neill" ], home.addressee.children.map(&:lastName).uniq
    assert_equal 4, home.residents.size

    dana = person(6)
    assert_equal [ "Dana", "Smith" ], [ dana.firstName, dana.lastName ]
    assert_equal address(2).id, dana.address_id
  end

  test "cleans values and keeps the old timestamps" do
    importer.write!

    pine = address(2)
    assert_equal "2 Pine Road", pine.street1
    assert_nil pine.street2
    assert_nil person(1).suffix
    assert_equal "Jr.", person(2).suffix
    assert_nil person(5).spouse_id, "link to a missing person dropped"
    assert_equal Time.utc(2023, 12, 1, 18, 30), address(1).updated_at
    assert_equal "2023", address(1).lastSent
  end

  test "reports what it changed and what needs a look" do
    report = importer.report

    assert_includes report.changes["Spouse link made two-way"], "#2 Bob O'Neill Jr. -> #1 Ann O'Neill"
    assert_includes report.changes["Child moved from the spouse to the addressee"], "#3 Cara"
    assert_includes report.changes["Child's full name split into first and last"], "#6 Dana Smith"
    assert_includes report.changes["Link to a missing record dropped"], "#5 Zoë Müller: spouse_id 99"
    assert_includes report.review["Placeholder name"], "#4 Child 2 O'Neill"
    assert_includes report.review["Not in any household"], "#7 Lee Loner"
    assert_includes report.review["Street unknown"], "address #3 UNKNOWN"
    assert_includes report.to_s, "For review (imported as is):"
  end

  test "a second run overwrites instead of duplicating, and verifies clean" do
    importer.write!
    importer.write!

    assert_equal 3, Address.count
    assert_equal 7, Person.count
    assert_empty importer.verify
  end

  test "verify finds records that are missing or changed" do
    run = importer
    run.write!
    person(7).delete
    person(1).update_attributes!(firstName: "Annie")

    problems = run.verify

    assert_includes problems, "missing #{Legacy::MariadbImporter.person_id(7)}"
    assert(problems.any? { |p| p.include?("firstName") })
  end

  test "skip leaves people out and drops links to them" do
    run = importer(skip: %w[4 7])
    run.write!

    assert_equal 5, Person.count
    assert_equal [ "Cara" ], address(1).addressee.children.map(&:firstName)
    assert_includes run.report.changes["Skipped (SKIP)"], "#7 Lee Loner"
  end

  test "rollback deletes only what the import created" do
    run = importer
    run.write!
    mine = Person.create!(firstName: "New", lastName: "Entry")
    assert_equal [ mine.id ], run.foreign_ids

    run.rollback!

    assert_equal 0, Address.count
    assert_equal [ mine.id ], Person.all.map(&:id).to_a
  end
end
