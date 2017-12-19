module PeopleHelper
  def setup_person(person)
    person.build_address() if (person.address.nil?)
    person.build_spouse() if (person.spouse.nil?)
    return person
  end
  
  def full_name(person)
    return "" if person.nil?
    
    return h("#{person.firstName} #{person.lastName}")
  end
end
