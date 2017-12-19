class Address < ApplicationRecord
  has_one :resident, :class_name => "Person", :dependent => :destroy
  belongs_to :spouse, :class_name => "Person", :dependent => :destroy
  has_many :children, through: :resident
  
  accepts_nested_attributes_for :resident, :allow_destroy => true, reject_if: :all_blank
end
