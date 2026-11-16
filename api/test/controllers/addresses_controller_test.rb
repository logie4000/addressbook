require "test_helper"

class AddressesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @address = Address.create!(street1: "1 Main St", street2: "Apt 2", city: "Springfield", state: "IL", zip: "62701", comments: "Front door", lastSent: "2025")
    @addressee = Person.create!(firstName: "Ann", lastName: "Zeta", address_id: @address.id)
    @spouse = Person.create!(firstName: "Bob", lastName: "Zeta", address_id: @address.id, spouse_id: @addressee.id)
    @addressee.update_attributes!(spouse_id: @spouse.id)
    @child = Person.create!(firstName: "Cal", lastName: "Zeta", parent_id: @addressee.id)
    @address.update_attributes!(addressee_id: @addressee.id)

    @other = Address.create!(street1: "9 Elm St", city: "Shelbyville")
    @other.update_attributes!(addressee_id: Person.create!(firstName: "Al", lastName: "Alpha", address_id: @other.id).id)
  end

  test "should get index sorted by addressee last name" do
    get api_v1_addresses_url, as: :json
    assert_response :success

    body = response.parsed_body
    assert_equal [ "Alpha", "Zeta" ], body.map { |a| a.dig("addressee", "lastName") }
    assert_equal "Bob", body.last.dig("addressee", "spouse", "firstName")
    assert_equal @address.id, body.last["id"]
    assert_equal @addressee.id, body.last["addressee_id"]
    assert_equal "2025-12-21", body.last["lastSent"], "a bare year is stored as December 21"
    assert_nil body.last["comments"], "the list leaves out the comments"
    assert_equal [ "Cal" ], body.last.dig("addressee", "children").map { |c| c["firstName"] }
    assert_equal [], body.first.dig("addressee", "children")
  end

  test "should create address" do
    assert_difference("Address.count") do
      post api_v1_addresses_url, params: { address: { city: "Capital City", street1: "5 Oak Ave", zip: "12345" } }, as: :json
    end

    assert_response :created
    assert_equal "Capital City", response.parsed_body["city"]
  end

  test "should show address with addressee, spouse and children" do
    get api_v1_address_url(@address), as: :json
    assert_response :success

    body = response.parsed_body
    assert_equal "1 Main St", body["street1"]
    assert_equal "Ann", body.dig("addressee", "firstName")
    assert_equal "Bob", body.dig("addressee", "spouse", "firstName")
    assert_equal [ "Cal" ], body.dig("addressee", "children").map { |c| c["firstName"] }
    assert body["addressee"].key?("suffix"), "the edit form needs the suffix"
  end

  test "should return not found for a missing address" do
    get api_v1_address_url("does-not-exist"), as: :json
    assert_response :not_found
  end

  test "should update address" do
    patch api_v1_address_url(@address), params: { address: { city: "Ogdenville" } }, as: :json
    assert_response :success

    assert_equal "Ogdenville", Address.find(@address.id).city
  end

  test "should update last sent and notes" do
    patch api_v1_address_url(@address), params: { address: { lastSent: "2025-06-30", comments: "Moved in March" } }, as: :json
    assert_response :success

    address = Address.find(@address.id)
    assert_equal Date.new(2025, 6, 30), address.lastSent
    assert_equal "Moved in March", address.comments
  end

  test "should destroy address and its residents" do
    assert_difference("Address.count", -1) do
      assert_difference("Person.count", -2) do
        delete api_v1_address_url(@address), as: :json
      end
    end

    assert_response :no_content
  end

  # --- Last sent: blank, cleared, bad and older values ---------------------

  test "index and show return null for an address never sent" do
    get api_v1_addresses_url, as: :json
    assert_response :success
    alpha = response.parsed_body.find { |a| a["id"] == @other.id }
    assert alpha.key?("lastSent")
    assert_nil alpha["lastSent"]

    get api_v1_address_url(@other), as: :json
    assert_response :success
    assert_nil response.parsed_body["lastSent"]
  end

  test "should create an address with a blank last sent" do
    post api_v1_addresses_url, params: { address: { street1: "5 Oak Ave", city: "Capital City", lastSent: "" } }, as: :json

    assert_response :created
    assert_nil response.parsed_body["lastSent"]
    assert_nil Address.find(response.parsed_body["id"]).lastSent
  end

  test "should create an address with a full date" do
    post api_v1_addresses_url, params: { address: { street1: "5 Oak Ave", lastSent: "2025-12-02" } }, as: :json

    assert_response :created
    assert_equal "2025-12-02", response.parsed_body["lastSent"]
  end

  test "should clear last sent with an empty string, as the date picker sends" do
    patch api_v1_address_url(@address), params: { address: { lastSent: "" } }, as: :json

    assert_response :success
    assert_nil response.parsed_body["lastSent"]
    assert_nil Address.find(@address.id).lastSent
  end

  test "should clear last sent with null" do
    patch api_v1_address_url(@address), params: { address: { lastSent: nil } }, as: :json

    assert_response :success
    assert_nil Address.find(@address.id).lastSent
  end

  test "should reject a last sent that isn't a date and keep the old one" do
    patch api_v1_address_url(@address), params: { address: { lastSent: "last Christmas", city: "Ogdenville" } }, as: :json

    assert_response :unprocessable_content
    assert_includes response.parsed_body["lastSent"].join, "is not a date"
    address = Address.find(@address.id)
    assert_equal Date.new(2025, 12, 21), address.lastSent
    assert_equal "Springfield", address.city
  end

  test "index and show still work when older records hold a blank or year-only last sent" do
    Dynamoid.adapter.put_item(Address.table_name, { id: "old-blank", street1: "Old 1", lastSent: "" })
    Dynamoid.adapter.put_item(Address.table_name, { id: "old-year", street1: "Old 2", lastSent: "2024" })

    get api_v1_addresses_url, as: :json
    assert_response :success
    by_id = response.parsed_body.index_by { |a| a["id"] }
    assert_nil by_id["old-blank"]["lastSent"]
    assert_equal "2024-12-21", by_id["old-year"]["lastSent"]

    get api_v1_address_url("old-blank"), as: :json
    assert_response :success
    assert_nil response.parsed_body["lastSent"]
  end
end
