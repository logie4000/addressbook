class Address < ApplicationRecord
  has_many :children, :dependent => destroy
  has_one :spouse, :class "Person", :optional => true
end
