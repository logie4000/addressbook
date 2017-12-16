module AddressesHelper
  def setup_address(address)
    if (address.spouse.nil?)
      address.build_spouse()
    end
    
    return address
  end
end
