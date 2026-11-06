require "test_helper"

class SeedsTest < ActiveSupport::TestCase
  test "sample data links each household together" do
    out, _err = capture_io { load Rails.root.join("db/seeds.rb") }
    assert_includes out, "added:   Alice Martin"

    assert_equal 5, Address.count
    assert_equal 14, Person.count

    address = Address.all.to_a.find { |a| a.street1 == "12 Elm Street" }
    assert_equal "Alice", address.addressee.firstName
    assert_equal "Ben", address.spouse.firstName
    assert_equal address.addressee_id, address.spouse.spouse_id
    assert_equal %w[Chloe Danny], address.addressee.children.map(&:firstName).sort
    assert_equal 4, address.residents.size
  end
end
