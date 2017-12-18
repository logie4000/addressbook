class Address < ApplicationRecord
  has_many :children, :class_name => "Person", :dependent => :destroy
  belongs_to :spouse, :class_name => "Person", :dependent => :destroy
  
  accepts_nested_attributes_for :spouse, :allow_destroy => true
  accepts_nested_attributes_for :children, :allow_destroy => true
end
