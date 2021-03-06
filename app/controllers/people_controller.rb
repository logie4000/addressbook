class PeopleController < ApplicationController
  before_action :set_person, only: [:show, :edit, :update, :destroy, :remove_child]

  # GET /people
  # GET /people.json
  def index
    @people = Person.all
  end
  
  # GET /people/1
  # GET /people/1.json
  def show
    @address = @person.address
    @spouse = @person.spouse
    @children = @person.children
    
    if (@children.empty? && @spouse && !@spouse.children.empty?)
      @children = @spouse.children
    end
  end

  # GET /people/new
  def new
    @person = Person.new
  end

  # GET /people/1/edit
  def edit
    @person.children.build()
  end

  # POST /people
  # POST /people.json
  def create
    @person = Person.new(person_params)

    respond_to do |format|
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
        
        format.html { redirect_to @person, notice: 'Person was successfully created.' }
        format.json { render :show, status: :created, location: @person }
      else
        format.html { render :new }
        format.json { render json: @person.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /people/1
  # PATCH/PUT /people/1.json
  def update
    Rails.logger.debug "Running Person.update(#{params.inspect})"
    
    respond_to do |format|
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
        
        format.html { redirect_to @person, notice: 'Person was successfully updated.' }
        format.json { render :show, status: :ok, location: @person }
      else
        format.html { render :edit }
        format.json { render json: @person.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /people/1
  # DELETE /people/1.json
  def destroy
    @person.destroy
    respond_to do |format|
      format.html { redirect_to people_url, notice: 'Person was successfully destroyed.' }
      format.json { head :no_content }
    end
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
      @person = Person.find(params[:id])
      if (@person.parent)
        @person = @person.parent
      end
      
      if (@person.address.addressee && @person != @person.address.addressee)
        @person = @person.address.addressee
      end
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def person_params
      params.require(:person).permit(:lastName, :firstName, :suffix, :address_attributes => [:id, :street1, :street2, :city, :state, :zip, :lastSent, :_destroy], :spouse_attributes => [:id, :lastName, :firstName, :suffix, :_destroy], :children_attributes => [:id, :lastName, :firstName, :suffix, :_destroy])
    end
end
