# Every household in the address book as one JSON document, the format the
# export (and, later, the import) uses:
#
#   { "format": "addressbook-households", "version": 1, "exportedAt": "...",
#     "households": [ { "id", "street1", "street2", "city", "state", "zip",
#                       "lastSent", "comments",
#                       "addressee": { "id", "firstName", "lastName", "suffix" },
#                       "spouse":    { ... } or null,
#                       "children":  [ { "id", "firstName", "lastName" } ] } ] }
#
# Reads each table once and joins them in memory.
class HouseholdExport
  FORMAT = "addressbook-households".freeze
  VERSION = 1

  def as_json(*)
    {
      "format" => FORMAT,
      "version" => VERSION,
      "exportedAt" => Time.current.utc.iso8601,
      "households" => households
    }
  end

  private
    def households
      people = Person.all.to_a
      by_id = people.index_by(&:id)
      children_by_parent = people.group_by(&:parent_id)

      list = Address.all.map do |address|
        addressee = by_id[address.addressee_id]
        spouse = addressee && by_id[addressee.spouse_id]
        children = addressee && (children_by_parent[addressee.id] || (spouse && children_by_parent[spouse.id]))

        {
          "id" => address.id,
          "street1" => address.street1, "street2" => address.street2,
          "city" => address.city, "state" => address.state, "zip" => address.zip,
          "lastSent" => address.lastSent&.iso8601,
          "comments" => address.comments,
          "addressee" => addressee && person(addressee).merge("suffix" => addressee.suffix),
          "spouse" => spouse && person(spouse).merge("suffix" => spouse.suffix),
          "children" => Array(children).sort_by { |c| c.firstName.to_s.downcase }.map { |child| person(child) }
        }
      end

      list.sort_by { |h| [ h.dig("addressee", "lastName").to_s.downcase, h.dig("addressee", "firstName").to_s.downcase ] }
    end

    def person(record)
      { "id" => record.id, "firstName" => record.firstName, "lastName" => record.lastName }
    end
end
