class CreateAddresses < ActiveRecord::Migration[5.1]
  def change
    create_table :addresses do |t|
      t.string :lastName
      t.string :firstName
      t.string :street1
      t.string :street2
      t.string :city
      t.string :state
      t.string :zip

      t.timestamps
    end
  end
end
