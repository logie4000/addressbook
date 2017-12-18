class Address < ApplicationRecord
  has_many :children, :class_name => "Person", :dependent => :destroy
  has_one :spouse, :class_name => "Person", :dependent => :destroy
  
  accepts_nested_attributes_for :spouse, :allow_destroy => true, reject_if: :all_blank
  accepts_nested_attributes_for :children, :allow_destroy => true, reject_if: :all_blank
end
