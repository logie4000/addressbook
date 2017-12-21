class Person < ApplicationRecord
  belongs_to :address, :optional => true
  
  belongs_to :spouse, :class_name => "Person", :optional => true
  has_many :children, :class_name => "Person", :foreign_key => "parent_id"
  belongs_to :parent, :class_name => "Person", :optional => true
  
  accepts_nested_attributes_for :address, :allow_destroy => true, reject_if: :all_blank
  accepts_nested_attributes_for :spouse, :allow_destroy => true, reject_if: :all_blank
  accepts_nested_attributes_for :children, :allow_destroy => true, reject_if: :validate_child
  
  def self.child_placeholder_value
    return "New child"
  end
  
  def validate_child(attributes)
    # Returns true if the attributes are invalid
    if (attributes[:firstName].blank? && attributes[:lastName].blank?)
      return true
    elsif attributes[:firstName] == Person.child_placeholder_value
      return true
    else
      return false
    end
  end
end
