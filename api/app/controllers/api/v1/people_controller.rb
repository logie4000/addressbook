class Api::V1::PeopleController < ApplicationController
  before_action :set_person, only: %i[ show update destroy ]

  INDEX_FIELDS = %w[ id firstName lastName suffix spouse_id address_id ].freeze
  ADDRESS_FIELDS = %w[ id street1 street2 city state zip ].freeze

  # GET /people
  #
  # Reads each table once and works out spouses, children and addresses in
  # memory, rather than making a DynamoDB request per person.
  def index
    all_people = Person.all.to_a
    addresses = Address.all.index_by(&:id)
    by_id = all_people.index_by(&:id)
    children_by_parent = all_people.group_by(&:parent_id)

    people = all_people.sort_by { |person| person.lastName.to_s }.map do |person|
      spouse = by_id[person.spouse_id]

      person.attributes.stringify_keys.slice(*INDEX_FIELDS).merge(
        "spouse" => spouse && name_fields(spouse),
        "children" => Array(children_by_parent[person.id]).map { |child| name_fields(child) },
        "address" => addresses[person.address_id]&.attributes&.stringify_keys&.slice(*ADDRESS_FIELDS)
      )
    end

    render json: people
  end

  # GET /people/1
  #
  # Shows the person's household: asking for a spouse or child returns the
  # household head (see set_person).
  def show
    address = @person.address
    spouse = @person.spouse
    children = @person.children

    if children.empty? && spouse && !spouse.children.empty?
      children = spouse.children
    end

    render json: @person.attributes.stringify_keys.slice("id", "firstName", "lastName", "suffix").merge(
      "spouse" => spouse && name_fields(spouse),
      "children" => children.map { |child| name_fields(child) },
      "address" => address && address.attributes.stringify_keys.slice(*ADDRESS_FIELDS)
    )
  end

  # POST /people
  def create
    @person = Person.new(person_params)

    if @person.save
      link_family(@person)

      render json: @person, status: :created, location: api_v1_person_url(@person)
    else
      render json: @person.errors, status: :unprocessable_content
    end
  end

  # PATCH/PUT /people/1
  def update
    @person.assign_attributes(person_params)

    if @person.save
      if @person.address && @person.address.addressee.nil?
        @person.address.addressee = @person
        @person.address.save
      end

      if @person.spouse
        @person.spouse.address = @person.address
        @person.spouse.spouse = @person
        @person.spouse.save
      end

      render json: @person
    else
      render json: @person.errors, status: :unprocessable_content
    end
  end

  # DELETE /people/1
  def destroy
    @person.destroy!
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_person
      @person = Person.find(params.expect(:id))
      if @person.parent
        @person = @person.parent
      end

      addressee = @person.address&.addressee
      if addressee && @person.id != addressee.id
        @person = addressee
      end
    end

    # Fills in the defaults a new household gets: the address is addressed to
    # this person, and a spouse or child with no last name takes theirs.
    def link_family(person)
      if person.address && person.address.addressee.nil?
        person.address.addressee = person
        person.address.save
      end

      if person.spouse && person.spouse.lastName.blank?
        person.spouse.lastName = person.lastName
        person.spouse.save
      end

      person.children.each do |child|
        if child.lastName.blank?
          child.lastName = person.lastName
          child.save
        end
      end
    end

    # Only allow a list of trusted parameters through.
    def person_params
      params.expect(person: [ :lastName, :firstName, :suffix, :address_id, :parent_id, :spouse_id,
        address_attributes: [ :id, :street1, :street2, :city, :state, :zip, :lastSent, :comments, :_destroy ],
        spouse_attributes: [ :id, :lastName, :firstName, :suffix, :_destroy ],
        children_attributes: [ [ :id, :lastName, :firstName, :suffix, :_destroy ] ] ])
    end

    def name_fields(person)
      { "id" => person.id, "firstName" => person.firstName, "lastName" => person.lastName }
    end
end
