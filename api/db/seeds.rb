# Sample data for local development. Load it with:
#
#   bin/rails dynamodb:seed
#
# Everything here is made up. Each household is an address, the person the
# mail goes to (the addressee), and optionally a spouse and children.

HOUSEHOLDS = [
  {
    address: { street1: "12 Elm Street", city: "Springfield", state: "IL", zip: "62701",
               lastSent: "2025", comments: "Prefers cards over email" },
    addressee: { firstName: "Alice", lastName: "Martin" },
    spouse: { firstName: "Ben", lastName: "Martin" },
    children: [ { firstName: "Chloe", lastName: "Martin" }, { firstName: "Danny", lastName: "Martin" } ]
  },
  {
    address: { street1: "400 Lakeview Drive", street2: "Apt 3B", city: "Madison", state: "WI", zip: "53703",
               lastSent: "2024" },
    addressee: { firstName: "Carlos", lastName: "Rivera", suffix: "Jr." },
    spouse: { firstName: "Dana", lastName: "Rivera" },
    children: [ { firstName: "Elena", lastName: "Rivera" } ]
  },
  {
    address: { street1: "7 Harbor Road", city: "Portland", state: "ME", zip: "04101", lastSent: "2025" },
    addressee: { firstName: "Grace", lastName: "Okafor" }
  },
  {
    address: { street1: "2219 Mesa Verde Lane", city: "Tucson", state: "AZ", zip: "85719",
               comments: "Moved here in 2024" },
    addressee: { firstName: "Henry", lastName: "Nguyen" },
    spouse: { firstName: "Iris", lastName: "Nguyen" }
  },
  {
    address: { street1: "88 Birch Court", city: "Boulder", state: "CO", zip: "80302", lastSent: "2023" },
    addressee: { firstName: "Julia", lastName: "Schmidt" },
    children: [ { firstName: "Kai", lastName: "Schmidt" }, { firstName: "Lena", lastName: "Schmidt" },
                { firstName: "Max", lastName: "Schmidt" } ]
  }
].freeze

HOUSEHOLDS.each do |household|
  address = Address.create!(household[:address])

  addressee = Person.create!(household[:addressee].merge(address_id: address.id))
  address.update_attributes!(addressee_id: addressee.id)

  if household[:spouse]
    spouse = Person.create!(household[:spouse].merge(address_id: address.id, spouse_id: addressee.id))
    addressee.update_attributes!(spouse_id: spouse.id)
  end

  Array(household[:children]).each do |child|
    Person.create!(child.merge(address_id: address.id, parent_id: addressee.id))
  end

  puts "added:   #{addressee.firstName} #{addressee.lastName}, #{address.street1}"
end
