class Address < ApplicationRecord
  has_one :resident, :class_name => "Person", :dependent => :destroy
  has_one :spouse, :through => :resident, :class_name => "Person", :dependent => :destrory
  
  accepts_nested_attributes_for :resident, :allow_destroy => true, reject_if: :all_blank
end
