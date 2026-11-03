require "test_helper"

class PeopleControllerTest < ActionDispatch::IntegrationTest
  setup do
    @address = Address.create!(street1: "1 Main St", city: "Springfield", state: "IL", zip: "62701")
    @person = Person.create!(firstName: "Ann", lastName: "Zeta", address_id: @address.id)
    @spouse = Person.create!(firstName: "Bob", lastName: "Zeta", address_id: @address.id, spouse_id: @person.id)
    @person.update_attributes!(spouse_id: @spouse.id)
    @child = Person.create!(firstName: "Cal", lastName: "Zeta", parent_id: @person.id)
    @address.update_attributes!(addressee_id: @person.id)
  end

  test "should get index sorted by last name with spouse and children" do
    Person.create!(firstName: "Al", lastName: "Alpha")

    get api_v1_people_url, as: :json
    assert_response :success

    body = response.parsed_body
    assert_equal "Alpha", body.first["lastName"]

    ann = body.find { |p| p["id"] == @person.id }
    assert_equal "Bob", ann.dig("spouse", "firstName")
    assert_equal [ "Cal" ], ann["children"].map { |c| c["firstName"] }
  end

  test "should create person with nested address, spouse and children" do
    assert_difference("Person.count", 4) do
      assert_difference("Address.count", 1) do
        post api_v1_people_url, params: { person: {
          firstName: "Dee", lastName: "Delta",
          address_attributes: { street1: "7 Pine Rd", city: "Capital City" },
          spouse_attributes: { firstName: "Eve", lastName: "" },
          children_attributes: [
            { firstName: "Fay", lastName: "" },
            { firstName: Person.child_placeholder_value, lastName: "" },
            { firstName: "Gus", lastName: "Other" }
          ]
        } }, as: :json
      end
    end

    assert_response :created

    dee = Person.find(response.parsed_body["id"])
    assert_equal "7 Pine Rd", dee.address.street1
    assert_equal dee.id, dee.address.addressee_id
    assert_equal "Delta", dee.spouse.lastName
    assert_equal({ "Fay" => "Delta", "Gus" => "Other" }, dee.children.to_h { |c| [ c.firstName, c.lastName ] })
  end

  test "should show person" do
    get api_v1_person_url(@person), as: :json
    assert_response :success

    body = response.parsed_body
    assert_equal "Ann", body["firstName"]
    assert_equal "Bob", body.dig("spouse", "firstName")
    assert_equal [ "Cal" ], body["children"].map { |c| c["firstName"] }
    assert_equal "1 Main St", body.dig("address", "street1")
  end

  test "showing a child shows the parent's household" do
    get api_v1_person_url(@child), as: :json
    assert_response :success
    assert_equal @person.id, response.parsed_body["id"]
  end

  test "should show a person with no spouse or address" do
    loner = Person.create!(firstName: "Lou", lastName: "Solo")

    get api_v1_person_url(loner), as: :json
    assert_response :success

    body = response.parsed_body
    assert_nil body["spouse"]
    assert_nil body["address"]
    assert_equal [], body["children"]
  end

  test "should update person and keep spouse at the same address" do
    patch api_v1_person_url(@person), params: { person: {
      firstName: "Anne",
      address_attributes: { id: @address.id, city: "Ogdenville" }
    } }, as: :json
    assert_response :success

    assert_equal "Anne", Person.find(@person.id).firstName
    assert_equal "Ogdenville", Address.find(@address.id).city
    assert_equal @address.id, Person.find(@spouse.id).address_id
  end

  test "should remove a child through nested attributes" do
    patch api_v1_person_url(@person), params: { person: {
      children_attributes: [ { id: @child.id, _destroy: "1" } ]
    } }, as: :json
    assert_response :success

    assert_empty Person.find(@person.id).children
  end

  test "should destroy person" do
    assert_difference("Person.count", -1) do
      delete api_v1_person_url(@spouse), as: :json
    end

    assert_response :no_content
  end
end
