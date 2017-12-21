class Address < ApplicationRecord
  has_many :residents, :class_name => "Person", :dependent => :destroy
  belongs_to :addressee, :class_name => "Person"
  has_one :spouse, :through => :addressee, :class_name => "Person", :dependent => :destroy
  
  accepts_nested_attributes_for :residents, :allow_destroy => true, reject_if: :all_blank
  accepts_nested_attributes_for :addressee, :allow_destroy => true, reject_if: :all_blank
  accepts_nested_attributes_for :spouse, :allow_destroy => true, reject_if: :all_blank
end
