# A person in the address book, stored in the DynamoDB "people" table.
#
# Relationships are kept as plain id fields, the DynamoDB equivalent of
# foreign keys:
#   address_id  the Address this person lives at
#   spouse_id   another Person
#   parent_id   another Person (set on children)
#
# Two global secondary indexes let us look up children and residents with a
# Query instead of scanning the whole table.
class Person
  include Dynamoid::Document
  include NestedAttributes

  table name: :people

  field :lastName
  field :firstName
  field :suffix
  field :address_id
  field :parent_id
  field :spouse_id

  global_secondary_index hash_key: :parent_id, name: "parent_id-index", projected_attributes: :all
  global_secondary_index hash_key: :address_id, name: "address_id-index", projected_attributes: :all

  validate :nested_address_is_valid
  before_save :save_nested_belongs_to
  after_save :save_nested_children
  before_destroy :clear_references_to_self

  def self.child_placeholder_value
    "New child"
  end

  # --- Relationships -------------------------------------------------------

  def address
    @address = nil if @address && @address.id != address_id
    @address ||= address_id.presence && Address.find(address_id, raise_error: false)
  end

  def address=(record)
    @address = record
    self.address_id = record&.id
  end

  def spouse
    @spouse = nil if @spouse && @spouse.id != spouse_id
    @spouse ||= spouse_id.presence && Person.find(spouse_id, raise_error: false)
  end

  def spouse=(record)
    @spouse = record
    self.spouse_id = record&.id
  end

  def parent
    @parent = nil if @parent && @parent.id != parent_id
    @parent ||= parent_id.presence && Person.find(parent_id, raise_error: false)
  end

  def parent=(record)
    @parent = record
    self.parent_id = record&.id
  end

  def children
    return [] if id.blank?

    Person.where(parent_id: id).to_a
  end

  # --- Nested attributes (address_attributes, spouse_attributes, children_attributes)

  def address_attributes=(attrs)
    @pending_address = build_nested(Address, nested_hash(attrs), reject: ALL_BLANK,
                                    existing: ->(id) { address if address_id == id })
  end

  def spouse_attributes=(attrs)
    @pending_spouse = build_nested(Person, nested_hash(attrs), reject: ALL_BLANK,
                                   existing: ->(id) { spouse if spouse_id == id })
  end

  def children_attributes=(list)
    @pending_children = nested_list(list).filter_map do |attrs|
      build_nested(Person, attrs, reject: ->(a) { validate_child(a) })
    end
  end

  def validate_child(child)
    # Returns true if the attributes are invalid
    if child[:firstName].blank? && child[:lastName].blank?
      Rails.logger.debug "Rejecting child because firstName and lastName are blank: #{child.inspect}"
      true
    elsif child[:firstName] == Person.child_placeholder_value
      Rails.logger.debug "Rejecting child because firstName is the placeholder: #{child.inspect}"
      true
    else
      Rails.logger.debug "Accepting nested child: #{child.inspect}"
      false
    end
  end

  private
    # A nested address (address_attributes) is saved with save!, so check it
    # here first: a bad value then comes back as a 422 with the person's
    # errors, e.g. "address.lastSent", rather than an exception.
    def nested_address_is_valid
      record, destroy = @pending_address
      return if record.nil? || destroy || record.valid?

      record.errors.each { |error| errors.add(:"address.#{error.attribute}", error.message) }
    end

    # Address and spouse are saved first so their ids can be stored on this person.
    def save_nested_belongs_to
      if (pending = @pending_address)
        @pending_address = nil
        record, destroy = pending
        if destroy
          record.destroy
          self.address = nil
        else
          record.save!
          self.address = record
        end
      end

      if (pending = @pending_spouse)
        @pending_spouse = nil
        record, destroy = pending
        if destroy
          record.destroy
          self.spouse = nil
        else
          record.save!
          self.spouse = record
        end
      end
    end

    # Children need this person's id, so they are saved afterwards.
    def save_nested_children
      pending = @pending_children
      @pending_children = nil
      Array(pending).each do |record, destroy|
        if destroy
          record.destroy
        else
          record.parent_id = id
          record.save!
        end
      end
    end

    # Without foreign key constraints, tidy up records that point at this person.
    def clear_references_to_self
      if address && address.addressee_id == id
        address.addressee_id = nil
        address.save!
      end

      if spouse && spouse.spouse_id == id
        spouse.spouse_id = nil
        spouse.save!
      end
    end
end
