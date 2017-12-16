class Address < ApplicationRecord
  has_many :children, class_name: "Person"
  has_one :spouse, class_name: "Person"

end
