# A mailing address, stored in the DynamoDB "addresses" table.
#
#   addressee_id  the Person the mail is addressed to
#
# The people living here (residents) are found through the people table's
# "address_id-index".
class Address
  include Dynamoid::Document

  table name: :addresses

  field :street1
  field :street2
  field :city
  field :state
  field :zip
  field :comments
  field :lastSent
  field :addressee_id

  before_destroy :destroy_residents

  def addressee
    @addressee = nil if @addressee && @addressee.id != addressee_id
    @addressee ||= addressee_id.presence && Person.find(addressee_id, raise_error: false)
  end

  def addressee=(record)
    @addressee = record
    self.addressee_id = record&.id
  end

  def spouse
    addressee&.spouse
  end

  def residents
    return [] if id.blank?

    Person.where(address_id: id).to_a
  end

  private
    # Matches the old `has_many :residents, dependent: :destroy`.
    def destroy_residents
      residents.each(&:destroy)
    end
end
