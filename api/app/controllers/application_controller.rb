class ApplicationController < ActionController::API
  # Active Record used to turn a missing record into a 404 automatically.
  rescue_from Dynamoid::Errors::RecordNotFound do
    head :not_found
  end

  rescue_from Dynamoid::Errors::DocumentNotValid do |error|
    render json: error.document.errors, status: :unprocessable_content
  end
end
