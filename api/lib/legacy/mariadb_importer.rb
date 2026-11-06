# Turns the rows of the old MariaDB address book (see MysqlDumpReader) into
# DynamoDB records, and writes, checks or removes them.
#
# Ids: each old integer id becomes a UUID derived from it (UUID v5), so the
# same dump always produces the same records and a second run overwrites
# instead of duplicating.
#
# Clean-up, every change listed in the report:
#   - surrounding spaces trimmed; blank strings stored as nil
#   - links to rows that don't exist dropped
#   - each household made whole, the way the new app saves one: the spouse
#     and children get the household's address, the spouse points back at
#     the addressee, children of the spouse hang off the addressee, and a
#     child with no last name takes the household's
#   - people in no household at all (no address, not anyone's spouse or
#     child) left out, with links to them dropped
#   - people listed in `skip` (old ids) left out the same way
#   - lastSent, a year in the old app, stored as December 21 of that year
#
# Things that look wrong but are kept as they are (placeholders, possible
# duplicates) are listed in the report for review.
module Legacy
  class MariadbImporter
    # Fixed namespace for the derived ids. Never change it: a re-run would
    # then create a second copy of everything.
    NAMESPACE = "8d0b6c3e-6f2a-4b8e-9b1d-5a7c2e4f1d30".freeze

    PLACEHOLDER = /\A(child(\s*unit)?\s*\d*|no child|spouse|new child|x+)\z/i

    Report = Struct.new(:changes, :review) do
      def initialize = super(Hash.new { |h, k| h[k] = [] }, Hash.new { |h, k| h[k] = [] })

      def to_s
        lines = []
        { "Changed" => changes, "For review (imported as is)" => review }.each do |title, groups|
          next if groups.empty?

          lines << "#{title}:"
          groups.each do |group, items|
            lines << "  #{group} (#{items.size})"
            items.each { |item| lines << "    - #{item}" }
          end
        end
        lines.join("\n")
      end
    end

    attr_reader :addresses, :people, :report

    def self.person_id(old_id) = Digest::UUID.uuid_v5(NAMESPACE, "people:#{old_id}")
    def self.address_id(old_id) = Digest::UUID.uuid_v5(NAMESPACE, "addresses:#{old_id}")

    def initialize(tables, skip: [])
      @report = Report.new
      @skip = skip.map(&:to_i).to_set
      @address_rows = tables.fetch("addresses", []).to_h { |row| [ row["id"], clean(row) ] }
      @person_rows = tables.fetch("people", []).filter_map do |row|
        if @skip.include?(row["id"])
          @report.changes["Skipped (SKIP)"] << label(clean(row))
          nil
        else
          [ row["id"], clean(row) ]
        end
      end.to_h
      build
    end

    def counts = { addresses: addresses.size, people: people.size }

    # --- Writing -------------------------------------------------------------

    def write!
      Address.import(addresses)
      Person.import(people)
    end

    # Ids already in the tables that this import doesn't account for, i.e.
    # records entered in the new app.
    def foreign_ids
      mine = (addresses + people).map { |attrs| attrs[:id] }.to_set
      (Address.all.map(&:id).to_a + Person.all.map(&:id).to_a).reject { |id| mine.include?(id) }
    end

    # Problems found by reading the records back: missing records, fields
    # that differ, and links pointing at nothing.
    def verify
      problems = []
      stored_addresses = Array(Address.find(addresses.map { |a| a[:id] }, raise_error: false)).index_by(&:id)
      stored_people = Array(Person.find(people.map { |p| p[:id] }, raise_error: false)).index_by(&:id)
      people_ids = stored_people.keys.to_set

      [ [ addresses, stored_addresses ], [ people, stored_people ] ].each do |expected, stored|
        expected.each do |attrs|
          record = stored[attrs[:id]] or (problems << "missing #{attrs[:id]}" and next)
          attrs.except(:id, :created_at, :updated_at).each do |field, value|
            actual = record.public_send(field)
            problems << "#{attrs[:id]} #{field}: #{actual.inspect} != #{value.inspect}" unless actual == value
          end
        end
      end

      stored_people.each_value do |person|
        %i[spouse_id parent_id].each do |link|
          target = person.public_send(link)
          problems << "#{person.id} #{link} points at nothing" if target && !people_ids.include?(target)
        end
        if person.address_id && !stored_addresses.key?(person.address_id)
          problems << "#{person.id} address_id points at nothing"
        end
      end
      stored_addresses.each_value do |address|
        if address.addressee_id && !people_ids.include?(address.addressee_id)
          problems << "#{address.id} addressee_id points at nothing"
        end
      end
      problems
    end

    # Deletes the records this dump created, and nothing else.
    def rollback!
      addresses.each_slice(25) { |batch| Dynamoid.adapter.batch_delete_item(Address.table_name => batch.map { |a| a[:id] }) }
      people.each_slice(25) { |batch| Dynamoid.adapter.batch_delete_item(Person.table_name => batch.map { |p| p[:id] }) }
    end

    private
      def build
        drop_dangling_links
        complete_households
        drop_orphans
        review_leftovers

        @address_rows.each_value do |row|
          next unless row["lastSent"].to_s.match?(/\A\d{4}\z/)

          @report.changes["Last sent year stored as December 21 of that year"] << "#{address_label(row)}: #{row['lastSent']}"
        end

        @addresses = @address_rows.values.map { |row| address_attributes(row) }
        @people = @person_rows.values.map { |row| person_attributes(row) }
      end

      def drop_dangling_links
        @person_rows.each_value do |person|
          { "address_id" => @address_rows, "spouse_id" => @person_rows, "parent_id" => @person_rows }.each do |field, rows|
            next if person[field].nil? || rows.key?(person[field])

            @report.changes["Link to a missing record dropped"] << "#{label(person)}: #{field} #{person[field]}"
            person[field] = nil
          end
        end

        @address_rows.each_value do |address|
          next if address["addressee_id"].nil? || @person_rows.key?(address["addressee_id"])

          @report.changes["Link to a missing record dropped"] << "address ##{address['id']}: addressee_id #{address['addressee_id']}"
          address["addressee_id"] = nil
        end
      end

      def complete_households
        @households = {}

        @address_rows.each_value do |address|
          head = @person_rows[address["addressee_id"]]
          unless head
            @report.review["Address with no addressee"] << address_label(address)
            next
          end

          home = address["id"]
          @households[home] = head["id"]
          move_in(head, home, "Addressee")

          spouse = @person_rows[head["spouse_id"]]
          if spouse
            if spouse["spouse_id"].nil?
              spouse["spouse_id"] = head["id"]
              @report.changes["Spouse link made two-way"] << "#{label(spouse)} -> #{label(head)}"
            elsif spouse["spouse_id"] != head["id"]
              @report.review["Spouse is married to someone else"] << "#{label(head)} -> #{label(spouse)} -> ##{spouse['spouse_id']}"
            end
            move_in(spouse, home, "Spouse")
          end

          parents = [ head["id"], spouse&.dig("id") ].compact
          @person_rows.each_value do |child|
            next unless parents.include?(child["parent_id"])

            if child["parent_id"] != head["id"]
              child["parent_id"] = head["id"]
              @report.changes["Child moved from the spouse to the addressee"] << label(child)
            end
            move_in(child, home, "Child")
            fill_child_name(child, head)
          end
        end
      end

      # Puts a household member at the household's address, unless they
      # already live somewhere else.
      def move_in(person, home, role)
        if person["address_id"].nil?
          person["address_id"] = home
          @report.changes["#{role} given the household's address"] << label(person)
        elsif person["address_id"] != home
          @report.review["#{role} has a different address"] <<
            "#{label(person)}: lives at ##{person['address_id']}, household is ##{home}"
        end
      end

      # The old form left a child's last name blank to mean "same as the
      # parent". Some full names were typed into the first-name box instead.
      def fill_child_name(child, head)
        return if child["lastName"] || head["lastName"].nil?

        if child["firstName"]&.include?(" ") && !child["firstName"].match?(PLACEHOLDER)
          first, _, last = child["firstName"].rpartition(" ")
          child["firstName"] = first
          child["lastName"] = last
          @report.changes["Child's full name split into first and last"] << label(child)
        else
          child["lastName"] = head["lastName"]
          @report.changes["Child given the household's last name"] << label(child)
        end
      end

      # People still without an address after the households were completed
      # belong to no household, so they are left out.
      def drop_orphans
        orphans = @person_rows.select { |_, person| person["address_id"].nil? }
        orphans.each_value { |person| @report.changes["Left out: in no household"] << label(person) }
        @person_rows.except!(*orphans.keys)

        @person_rows.each_value do |person|
          %w[spouse_id parent_id].each do |field|
            next unless orphans.key?(person[field])

            @report.changes["Link to a left-out person dropped"] << "#{label(person)}: #{field} #{person[field]}"
            person[field] = nil
          end
        end
      end

      def review_leftovers
        @person_rows.each_value do |person|
          if [ person["firstName"], person["lastName"] ].compact.empty?
            @report.review["No name"] << label(person)
          elsif person["firstName"].nil? || person["firstName"].match?(PLACEHOLDER)
            @report.review["Placeholder name"] << label(person)
          end

          unless @households.key?(person["address_id"])
            @report.review["Lives at an address with no addressee"] << label(person)
          end
        end

        @person_rows.values.group_by { |p| [ p["firstName"]&.downcase, p["lastName"]&.downcase ] }.each do |(first, last), group|
          next if group.size < 2 || first.nil? || first.match?(PLACEHOLDER)

          @report.review["Same name more than once"] << group.map { |p| label(p) }.join(", ")
        end

        @address_rows.values.group_by { |a| [ a["street1"]&.downcase, a["zip"] ] }.each do |(street, _), group|
          next if group.size < 2 || street == "unknown"

          @report.review["Same street address more than once"] << group.map { |a| address_label(a) }.join(", ")
        end

        @address_rows.each_value do |address|
          if address["street1"].nil? || address["street1"].casecmp?("unknown")
            @report.review["Street unknown"] << address_label(address)
          end
          if address["people_id"]
            @report.review["Old people_id column set (not migrated)"] << address_label(address)
          end
        end
      end

      def address_attributes(row)
        {
          id: self.class.address_id(row["id"]),
          street1: row["street1"], street2: row["street2"], city: row["city"], state: row["state"],
          zip: row["zip"], comments: row["comments"], lastSent: Address.sent_date(row["lastSent"]),
          addressee_id: row["addressee_id"] && self.class.person_id(row["addressee_id"]),
          created_at: time(row["created_at"]), updated_at: time(row["updated_at"])
        }
      end

      def person_attributes(row)
        {
          id: self.class.person_id(row["id"]),
          firstName: row["firstName"], lastName: row["lastName"], suffix: row["suffix"],
          address_id: row["address_id"] && self.class.address_id(row["address_id"]),
          spouse_id: row["spouse_id"] && self.class.person_id(row["spouse_id"]),
          parent_id: row["parent_id"] && self.class.person_id(row["parent_id"]),
          created_at: time(row["created_at"]), updated_at: time(row["updated_at"])
        }
      end

      def clean(row)
        row.transform_values do |value|
          value.is_a?(String) ? value.strip.presence : value
        end
      end

      # The dump is written in UTC (SET TIME_ZONE='+00:00').
      def time(value)
        value && Time.find_zone("UTC").parse(value.to_s)
      end

      def label(person)
        name = [ person["firstName"], person["lastName"], person["suffix"] ].compact.join(" ").presence || "(no name)"
        "##{person['id']} #{name}"
      end

      def address_label(address)
        "address ##{address['id']} #{[ address['street1'], address['city'], address['state'] ].compact.join(', ')}"
      end
  end
end
