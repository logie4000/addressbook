module AddressesHelper
  def setup_address(address)
    address.build_resident() if (address.resident.nil?)
    address.resident.build_spouse() if (address.resident.spouse.nil?)
    return address
  end
  
  def full_resident_name(resident)
    return "" if resident.nil?
    
    return h("#{resident.firstName} #{resident.lastName}")
  end
end
