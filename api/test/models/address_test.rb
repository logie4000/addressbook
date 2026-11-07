require "test_helper"

class AddressTest < ActiveSupport::TestCase
  # --- Last sent: what is accepted ------------------------------------------

  test "last sent is a date, and a bare year means December 21" do
    address = Address.create!(street1: "1 Main St", lastSent: "2024")
    assert_equal Date.new(2024, 12, 21), Address.find(address.id).lastSent

    address.update_attributes!(lastSent: "2025-03-04")
    assert_equal Date.new(2025, 3, 4), Address.find(address.id).lastSent

    address.lastSent = 2023
    address.save!
    assert_equal Date.new(2023, 12, 21), Address.find(address.id).lastSent

    address.lastSent = Date.new(2022, 7, 1)
    address.save!
    assert_equal Date.new(2022, 7, 1), Address.find(address.id).lastSent
  end

  test "a blank last sent is stored as nothing" do
    [ nil, "", "   " ].each do |blank|
      address = Address.create!(street1: "1 Main St", lastSent: blank)
      assert_nil address.lastSent, "#{blank.inspect} on create"
      assert_nil Address.find(address.id).lastSent, "#{blank.inspect} after reload"
    end
  end

  test "clearing last sent removes the stored date" do
    address = Address.create!(street1: "1 Main St", lastSent: "2024-12-21")

    address.update_attributes!(lastSent: "")
    assert_nil Address.find(address.id).lastSent

    address.update_attributes!(lastSent: "2024-12-21")
    address.update_attributes!(lastSent: nil)
    assert_nil Address.find(address.id).lastSent
  end

  test "an address with no last sent at all can be saved and read" do
    address = Address.create!(street1: "1 Main St")

    assert_nil Address.find(address.id).lastSent
    assert_equal [ address.id ], Address.all.map(&:id).to_a
  end

  test "text that isn't a date is rejected, not dropped silently" do
    address = Address.new(street1: "1 Main St", lastSent: "last Christmas")

    assert_not address.valid?
    assert_includes address.errors[:lastSent].join, "is not a date"
    assert_raises(Dynamoid::Errors::DocumentNotValid) { address.save! }

    address.lastSent = "2024"
    assert address.valid?, "a good value clears the error"
  end

  test "an impossible date is rejected" do
    address = Address.new(street1: "1 Main St", lastSent: "2025-02-30")

    assert_not address.valid?
  end

  # --- Last sent: what is stored ---------------------------------------------

  test "last sent is stored as a YYYY-MM-DD string" do
    address = Address.create!(street1: "1 Main St", lastSent: "2024")

    raw = Dynamoid.adapter.get_item(Address.table_name, address.id)
    assert_equal "2024-12-21", raw[:lastSent]
  end

  test "older records whose last sent is blank or only a year still load" do
    # As stored before lastSent became a date. Dynamoid's own date type
    # raised "invalid date" on these, so no address could be read at all.
    { "blank" => "", "spaces" => "  ", "year" => "2025", "junk" => "sometime" }.each do |id, value|
      Dynamoid.adapter.put_item(Address.table_name, { id: id, street1: "Old", lastSent: value })
    end

    assert_nil Address.find("blank").lastSent
    assert_nil Address.find("spaces").lastSent
    assert_equal Date.new(2025, 12, 21), Address.find("year").lastSent
    assert_nil Address.find("junk").lastSent
    assert_equal 4, Address.all.to_a.size
  end

  # --- SentDate.parse ---------------------------------------------------------

  test "SentDate.parse turns every accepted form into a Date or nil" do
    assert_equal Date.new(2024, 12, 21), SentDate.parse("2024")
    assert_equal Date.new(2024, 12, 21), SentDate.parse(" 2024 ")
    assert_equal Date.new(2024, 12, 21), SentDate.parse(2024)
    assert_equal Date.new(2025, 3, 4), SentDate.parse("2025-03-04")
    assert_equal Date.new(2025, 3, 4), SentDate.parse(Date.new(2025, 3, 4))
    assert_equal Date.new(2025, 3, 4), SentDate.parse(Time.utc(2025, 3, 4, 15))
    assert_nil SentDate.parse(nil)
    assert_nil SentDate.parse("")
    assert_nil SentDate.parse("   ")
    assert_nil SentDate.parse("sometime")
    assert_nil SentDate.parse("2025-02-30")
    assert_equal SentDate.parse("2024"), Address.sent_date("2024")
  end
end
