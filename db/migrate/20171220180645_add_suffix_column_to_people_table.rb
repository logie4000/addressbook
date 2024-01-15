class AddSuffixColumnToPeopleTable < ActiveRecord::Migration[5.1]
  def change
    add_column :people, :suffix, :string
  end
end
