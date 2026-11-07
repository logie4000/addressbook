# Field type for Address#lastSent: the date a card was last sent.
#
# In memory it is a Date (or nil); in DynamoDB a "YYYY-MM-DD" string. Both
# directions go through .parse, which accepts what older records and
# clients hold:
#
#   nil, "", "  "          -> nil
#   2024, "2024"           -> 2024-12-21 (the old app kept only the year)
#   "2025-03-04", a Date   -> that date
#   anything else          -> nil (Address reports it as a validation error)
#
# Dynamoid's built-in :date type raises Date::Error ("invalid date") on a
# stored "" or "2024", which made every read of the addresses table fail.
class SentDate
  YEAR = /\A\d{4}\z/

  def self.parse(value)
    case value
    when nil then nil
    when Date then value
    when Time then value.to_date
    else
      text = value.to_s.strip
      return nil if text.empty?
      return Date.new(text.to_i, 12, 21) if text.match?(YEAR)

      begin
        Date.iso8601(text)
      rescue Date::Error
        nil
      end
    end
  end

  def self.dynamoid_field_type = :string
  def self.dynamoid_dump(value) = parse(value)&.iso8601
  def self.dynamoid_load(value) = parse(value)
end
