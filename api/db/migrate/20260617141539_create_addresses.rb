class CreateAddresses < ActiveRecord::Migration[8.1]
  def change
    create_table :addresses, if_not_exists: true  do |t|
      t.string :street1
      t.string :street2
      t.string :city
      t.string :state
      t.string :zip
      t.text :comments
      t.string :lastSent
      
      t.timestamps
    end
  end
end
