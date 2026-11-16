# GET /api/v1/households: the whole address book for export (see HouseholdExport).
class Api::V1::HouseholdsController < ApplicationController
  def index
    render json: HouseholdExport.new
  end
end
