class Address < ApplicationRecord
  has_many :children, :dependent => :destroy
  belongs_to :spouse, :class_name => "Person", :optional => true
  
  accepts_nested_attributes_for :spouse, :allow_destroy => true
end
