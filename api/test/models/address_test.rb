require "test_helper"

class AddressTest < ActiveSupport::TestCase
  test "last sent is a date, and a bare year means December 21" do
    address = Address.create!(street1: "1 Main St", lastSent: "2024")
    assert_equal Date.new(2024, 12, 21), Address.find(address.id).lastSent

    address.update_attributes!(lastSent: "2025-03-04")
    assert_equal Date.new(2025, 3, 4), Address.find(address.id).lastSent

    address.lastSent = 2023
    assert_equal Date.new(2023, 12, 21), address.lastSent

    address.lastSent = ""
    assert_nil address.lastSent
  end
end
