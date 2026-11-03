# A small stand-in for Active Record's accepts_nested_attributes_for, since
# Dynamoid doesn't provide one. It handles the shapes this API receives:
#
#   *_attributes: { id:, ...fields, _destroy: }        (a single record)
#   *_attributes: [ { ... }, { ... } ]                  (a list of records)
#   *_attributes: { "0" => { ... }, "1" => { ... } }    (a list sent as a hash)
#
# A record with an id is updated (or destroyed when _destroy is truthy); a
# record without one is built, unless the reject proc says to skip it.
module NestedAttributes
  extend ActiveSupport::Concern

  TRUTHY = [ true, 1, "1", "true", "TRUE", "on" ].freeze

  # Rejects a nested hash whose fields (other than _destroy) are all blank.
  ALL_BLANK = ->(attrs) { attrs.except("_destroy").values.all?(&:blank?) }

  private
    def nested_hash(attrs)
      attrs = attrs.to_unsafe_h if attrs.respond_to?(:to_unsafe_h)
      attrs.to_h.with_indifferent_access
    end

    def nested_list(attrs)
      attrs = attrs.to_unsafe_h if attrs.respond_to?(:to_unsafe_h)
      list = attrs.is_a?(Hash) ? attrs.values : Array(attrs)
      list.map { |item| nested_hash(item) }
    end

    def destroy_flag?(attrs)
      TRUTHY.include?(attrs["_destroy"])
    end

    # Returns [record, destroy?] for one nested hash, or nil when it is rejected.
    # +existing+ finds a record by id; +reject+ decides whether to skip the hash.
    def build_nested(model, attrs, reject:, existing: nil)
      return nil if !destroy_flag?(attrs) && reject.call(attrs)

      fields = attrs.except("id", "_destroy")

      if attrs["id"].present?
        record = existing&.call(attrs["id"]) || model.find(attrs["id"])
        record.assign_attributes(fields)
        [ record, destroy_flag?(attrs) ]
      elsif destroy_flag?(attrs)
        nil
      else
        [ model.new(fields), false ]
      end
    end
end
