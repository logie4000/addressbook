module AddressesHelper
  def setup_address(address)
    if (address.residents.empty?)
      address.residents.build()
    end
    
    return address
  end
end
