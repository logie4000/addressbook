require "test_helper"

class HouseholdsControllerTest < ActionDispatch::IntegrationTest
  test "exports every household with its people" do
    home = Address.create!(street1: "1 Main St", city: "Springfield", state: "IL", zip: "62701",
                           comments: "Gate code 12", lastSent: "2024")
    ann = Person.create!(firstName: "Ann", lastName: "Zeta", suffix: "PhD", address_id: home.id)
    bob = Person.create!(firstName: "Bob", lastName: "Zeta", address_id: home.id, spouse_id: ann.id)
    ann.update_attributes!(spouse_id: bob.id)
    home.update_attributes!(addressee_id: ann.id)
    Person.create!(firstName: "Dee", lastName: "Zeta", address_id: home.id, parent_id: ann.id)
    Person.create!(firstName: "Cal", lastName: "Zeta", address_id: home.id, parent_id: ann.id)

    other = Address.create!(street1: "9 Oak Ave", city: "Shelbyville")
    amy = Person.create!(firstName: "Amy", lastName: "Adams", address_id: other.id)
    other.update_attributes!(addressee_id: amy.id)

    get api_v1_households_url, as: :json
    assert_response :success

    body = response.parsed_body
    assert_equal "addressbook-households", body["format"]
    assert_equal 1, body["version"]
    assert_equal [ "Adams", "Zeta" ], body["households"].map { |h| h.dig("addressee", "lastName") }

    zeta = body["households"].last
    assert_equal home.id, zeta["id"]
    assert_equal "2024-12-21", zeta["lastSent"]
    assert_equal "Gate code 12", zeta["comments"]
    assert_equal({ "id" => ann.id, "firstName" => "Ann", "lastName" => "Zeta", "suffix" => "PhD" }, zeta["addressee"])
    assert_equal "Bob", zeta.dig("spouse", "firstName")
    assert_equal %w[Cal Dee], zeta["children"].map { |c| c["firstName"] }

    assert_nil body["households"].first["spouse"]
    assert_nil body["households"].first["lastSent"], "never sent"
    assert_empty body["households"].first["children"]
  end
end
