class Person < ApplicationRecord
  belongs_to :address
  
  belongs_to :spouse, :class_name => "Person", :optional => true
  has_many :children, :class_name => "Person", :foreign_key => "parent_id"
  belongs_to :parent, :class_name => "Person", :optional => true
  
  accepts_nested_attributes_for :address, :allow_destroy => true, reject_if: :all_blank
end
