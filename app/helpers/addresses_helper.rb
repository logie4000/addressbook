module AddressesHelper
  def setup_address(address)
    if (address.spouse.nil?)
      address.build_spouse()
    end
    
    if (address.children.empty?)
      address.children.build()
    end
    
    return address
  end
end
