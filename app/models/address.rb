class Address < ApplicationRecord
  has_many :children
  has_one :spouse
end
