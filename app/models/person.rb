class Person < ApplicationRecord
  belongs_to :address, optional: true
end
