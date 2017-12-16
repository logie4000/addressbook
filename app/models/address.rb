class Address < ApplicationRecord
  has_many :children, optional: true, class_name: "Person"
  has_one :spouse, optional: true, class_name: "Person"

end
