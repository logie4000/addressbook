# A mailing address, stored in the DynamoDB "addresses" table.
#
#   addressee_id  the Person the mail is addressed to
#   lastSent      the date a card was last sent (see .sent_date)
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
  field :lastSent, :date
  field :addressee_id

  before_destroy :destroy_residents

  # The old app kept only the year a card was sent. A bare year (2024 or
  # "2024") stands for December 21 of that year; anything else is cast as a
  # date as usual.
  def self.sent_date(value)
    value.to_s.strip.match?(/\A\d{4}\z/) ? Date.new(value.to_i, 12, 21) : value
  end

  def write_attribute(name, value)
    value = self.class.sent_date(value) if (name.to_sym == :lastSent) # && value.present?)
    super
  end

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
