# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20171223032220) do

  create_table "addresses", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8" do |t|
    t.string "street1"
    t.string "street2"
    t.string "city"
    t.string "state"
    t.string "zip"
    t.text "comments"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "addressee_id"
    t.string "lastSent"
    t.index ["addressee_id"], name: "index_addresses_on_addressee_id"
  end

  create_table "people", force: :cascade, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8" do |t|
    t.string "lastName"
    t.string "firstName"
    t.bigint "address_id"
    t.bigint "parent_id"
    t.bigint "spouse_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "suffix"
    t.index ["address_id"], name: "index_people_on_address_id"
    t.index ["lastName"], name: "index_people_on_lastName"
    t.index ["parent_id"], name: "index_people_on_parent_id"
    t.index ["spouse_id"], name: "index_people_on_spouse_id"
  end

  add_foreign_key "addresses", "people", column: "addressee_id"
  add_foreign_key "people", "addresses"
end
