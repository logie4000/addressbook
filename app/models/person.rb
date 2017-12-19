class Person < ApplicationRecord
  belongs_to :address
  
  has_many :children, :class_name => "Person", :foreign_key => "parent_id"
  belongs_to :parent, :class_name => "Person"
end
