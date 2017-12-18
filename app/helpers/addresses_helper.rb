module AddressesHelper
  def setup_address(address)
    address.build_resident() if (address.resident.nil?)
    
    return address
  end
  
  def full_resident_name(resident)
    return h("#{resident.firstName} #{resident.lastName}")
  end
end
