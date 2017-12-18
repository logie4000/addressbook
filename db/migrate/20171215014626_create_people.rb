class CreatePeople < ActiveRecord::Migration[5.1]
  def change
    create_table :people do |t|
      t.string :lastName, index: true
      t.string :firstName
      t.references :address, index: true, foreign_key: true
      
      t.timestamps
    end
  end
end
