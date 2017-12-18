class Address < ApplicationRecord
  has_many :children, :dependent => :destroy
  belongs_to :spouse, :class_name => "Person", :optional => true
end
