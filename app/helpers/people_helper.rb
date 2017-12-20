module PeopleHelper
  def setup_person(person)
    person.build_address() if (person.address.nil?)
    person.build_spouse() if (person.spouse.nil?)
    person.children.build() if (person.children.empty?)
    
    return person
  end
  
  def full_name(person)
    return "" if person.nil?
    full_name = "#{person.firstName} #{person.lastName}"
    full_name += ", #{person.suffix}" unless (person.suffix.blank?)
    
    return h(full_name)
  end
end
