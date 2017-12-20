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
  
  def add_child_link(text, person)
    if (person && person.id)
      link_to(text, add_child_person_path( person ), :remote => true, :method => :patch )
    else
      link_to(text, add_child_row_person_path, :remote => true )
    end    
  end
  
  def remove_child_link(text, child)
    link_to(text, remove_child_person_path( child ), :remote => true, :method => :patch)
  end  
end
