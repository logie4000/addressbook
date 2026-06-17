class CreatePeople < ActiveRecord::Migration[8.1]
  def change
    create_table :people do |t|
      t.string :lastName
      t.string :firstName
      t.references :address, index: true, foreign_key: true
      t.references :parent, index: true
      t.references :spouse, index: true
      t.string :suffix

      t.timestamps
    end
  end
end
