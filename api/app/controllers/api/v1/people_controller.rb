class Api::V1::PeopleController < ApplicationController
  before_action :set_person, only: %i[ show update destroy ]

  # GET /people
  def index
    @people = Person.select(:id, :firstName, :lastName, :spouse_id, :address_id).order(:lastName).include(:spouse, :children)

    render json: @people, include: [ {:spouse => {include: { :id, :firstName, :lastName }}, :children => {include: { :id, :firstName, :lastName }}}]
  end

  # GET /people/1
  def show
    @address = @person.address
    @spouse = @person.spouse
    @children = @person.children

    if (@children.empty? && @spouse && !@spouse.children.empty?)
      @children = @spouse.children
    end

    render json: @person
  end

  # POST /people
  def create
    @person = Person.new(person_params)

    if @person.save
      if (@person.address.addressee.nil?)
        @person.address.addressee = @person
        @person.address.save
      end

      if (@person.spouse && @person.spouse.lastName == "")
        @person.spouse.lastName = @person.lastName
        @person.spouse.save
      end

      unless (@person.children.empty?)
        @person.children.each do |child|
          if (child.lastName == "")
            child.lastName = @person.lastName
            child.save
          end
        end
      end

      render json: @person, status: :created, location: @person
    else
      render json: @person.errors, status: :unprocessable_content
    end
  end

  # PATCH/PUT /people/1
  def update
    if @person.update(person_params)
      if (@person.address.addressee.nil?)
        @person.address.addressee = @person
        @person.address.save
      end
      
      if (@person.spouse)
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

  def remove_child
    Rails.logger.debug "remove_child: #{params.inspect}"
    child = Person.find(params[:child_id])

    @person.children.delete(child) if (@person)
    
    respond_to do |format|
      format.js
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_person
      @person = Person.find(params.expect(:id))
      if (@person.parent)
        @person = @person.parent
      end

      if (@person.address.addressee && @person != @person.address.addressee)
        @person = @person.address.addressee
      end
    end

    # Only allow a list of trusted parameters through.
    def person_params
      params.expect(person: [ :lastName, :firstName, :address_id, :parent_id, :spouse_id ],
        address_attributes: [ :id, :street1, :street2, :city, :state, :zip, :lastSent, :_destroy ],
        spouse_attributes: [ :id, :lastName, :firstName, :suffix, :_destroy ],
        children_attributes: [ :id, :lastName, :firstName, :suffix, :_destroy ])
    end
end
