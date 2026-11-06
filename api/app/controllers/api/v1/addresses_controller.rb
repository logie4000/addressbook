class Api::V1::AddressesController < ApplicationController
  before_action :set_address, only: %i[ show update destroy ]

  INDEX_FIELDS = %w[ id street1 street2 city state zip lastSent addressee_id ].freeze

  # GET /addresses
  #
  # Reads both tables once and joins them in memory, rather than making a
  # DynamoDB request per address.
  def index
    all_people = Person.all.to_a
    people = all_people.index_by(&:id)
    children_by_parent = all_people.group_by(&:parent_id)

    addresses = Address.all.map do |address|
      addressee = people[address.addressee_id]
      spouse = addressee && people[addressee.spouse_id]
      # Children hang off one parent; check the spouse too, as show does.
      children = addressee && (children_by_parent[addressee.id] || (spouse && children_by_parent[spouse.id]))

      address.attributes.stringify_keys.slice(*INDEX_FIELDS).merge(
        "addressee" => addressee && name_fields(addressee).merge(
          "spouse" => spouse && name_fields(spouse),
          "children" => Array(children).map { |child| name_fields(child) }
        )
      )
    end

    render json: addresses.sort_by { |a| a.dig("addressee", "lastName").to_s }
  end

  # GET /addresses/1
  def show
    addressee = @address.addressee

    render json: @address.as_json.merge(
      "addressee" => addressee && name_fields(addressee).merge(
        "spouse" => addressee.spouse && name_fields(addressee.spouse),
        "children" => addressee.children.map { |child| name_fields(child) }
      )
    )
  end

  # POST /addresses
  def create
    @address = Address.new(address_params)

    if @address.save
      render json: @address, status: :created, location: api_v1_address_url(@address)
    else
      render json: @address.errors, status: :unprocessable_content
    end
  end

  # PATCH/PUT /addresses/1
  def update
    @address.assign_attributes(address_params)

    if @address.save
      render json: @address
    else
      render json: @address.errors, status: :unprocessable_content
    end
  end

  # DELETE /addresses/1
  def destroy
    @address.destroy!
  end

  def mark_sent
    @address = Address.find(params[:id])
    @address.lastSent = Date.today.year.to_s

    if @address.save
      render json: @address
    else
      render json: @address.errors, status: :unprocessable_content
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_address
      @address = Address.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def address_params
      params.expect(address: [ :street1, :street2, :city, :state, :zip, :comments, :lastSent ])
    end

    def name_fields(person)
      { "id" => person.id, "firstName" => person.firstName, "lastName" => person.lastName }
    end
end
