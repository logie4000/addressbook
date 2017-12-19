class Address < ApplicationRecord
  has_one :resident, :class_name => "Person", :dependent => :destroy
  has_one :spouse, :through => :resident, :class_name => "Person", :dependent => :destroy
  
  accepts_nested_attributes_for :resident, :allow_destroy => true, reject_if: :all_blank
  accepts_nested_attributes_for :spouse, :allow_destroy => true, reject_if: :all_blank
end
