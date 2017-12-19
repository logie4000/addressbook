class Address < ApplicationRecord
  has_one :resident, :class_name => "Person", :dependent => :destroy
  
  accepts_nested_attributes_for :resident, :allow_destroy => true, reject_if: :all_blank
end
