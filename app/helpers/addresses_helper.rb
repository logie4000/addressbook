module AddressesHelper
  def setup_address(address)
    address.build_resident() if (address.resident.nil?)
    
    return address
  end
end
