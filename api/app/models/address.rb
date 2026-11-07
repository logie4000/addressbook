# A mailing address, stored in the DynamoDB "addresses" table.
#
#   addressee_id  the Person the mail is addressed to
#   lastSent      the date a card was last sent (a Date; see SentDate)
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
  field :lastSent, SentDate
  field :addressee_id

  before_destroy :destroy_residents
  validate :last_sent_is_a_date

  # A bare year (2024 or "2024") means December 21 of that year; see SentDate.
  def self.sent_date(value)
    SentDate.parse(value)
  end

  # Keeps lastSent a Date or nil. Text that isn't a date is remembered so
  # validation can reject it, instead of being dropped silently.
  def write_attribute(name, value)
    if name.to_sym == :lastSent
      parsed = SentDate.parse(value)
      @invalid_last_sent = (value if parsed.nil? && value.to_s.strip.present?)
      value = parsed
    end
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
    def last_sent_is_a_date
      errors.add(:lastSent, "is not a date (use YYYY-MM-DD or a year)") if @invalid_last_sent
    end

    # Matches the old `has_many :residents, dependent: :destroy`.
    def destroy_residents
      residents.each(&:destroy)
    end
end
