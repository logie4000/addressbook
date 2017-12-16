module AddressesHelper
  def setup_address(address)
    if (address.spouse.nil?)
      address.spouse.build()
    end
    
    return address
  end
end
