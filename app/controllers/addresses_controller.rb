class AddressesController < ApplicationController
  before_action :set_address, only: [:show, :edit, :update, :destroy]

  # GET /addresses
  # GET /addresses.json
  def index
    @addresses = Address.includes(:addressee).order("people.lastName ASC")
  end
  
  # GET /addresses/1
  # GET /addresses/1.json
  def show
  end

  # GET /addresses/new
  def new
    @address = Address.new
    @address.residents.build() if (@address.residents.empty?)
    @residents = @address.residents
  end

  # GET /addresses/1/edit
  def edit
  end

  # POST /addresses
  # POST /addresses.json
  def create
    @address = Address.new(address_params)

    respond_to do |format|
      if @address.save
        format.html { redirect_to @address, notice: 'Address was successfully created.' }
        format.json { render :show, status: :created, location: @address }
      else
        format.html { render :new }
        format.json { render json: @address.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /addresses/1
  # PATCH/PUT /addresses/1.json
  def update
    Rails.logger.debug "Running Address.update(#{params.inspect})"
    
    respond_to do |format|
      if @address.update(address_params)
        format.html { redirect_to @address, notice: 'Address was successfully updated.' }
        format.json { render :show, status: :ok, location: @address }
      else
        format.html { render :edit }
        format.json { render json: @address.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /addresses/1
  # DELETE /addresses/1.json
  def destroy
    @address.destroy
    respond_to do |format|
      format.html { redirect_to addresses_url, notice: 'Address was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  def mark_sent
    @address = Address.find(params[:id])
    @address.lastSent = Date.today.year.to_s
    respond_to do |format|
      if (@address.save)
        format.js
      else
        format.js
      end
    end
  end
      
  private
    # Use callbacks to share common setup or constraints between actions.
    def set_address
      @address = Address.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def address_params
      params.require(:address).permit(:lastName, :firstName, :street1, :street2, :city, :state, :zip, :lastSent, :residents_attributes => [:id, :lastName, :firstName, :suffix, :_destroy])
    end
end
