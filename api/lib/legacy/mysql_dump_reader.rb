# Reads the rows out of a mysqldump / mariadb-dump SQL file without needing a
# database server. It understands the parts of a dump that hold data:
#
#   CREATE TABLE `t` ( `col` ..., ... )            column order
#   INSERT INTO `t` VALUES (1,'a',NULL),(2,...);   rows
#   INSERT INTO `t` (`col`, ...) VALUES (...);     rows (--complete-insert)
#
# Values come back as Integer, Float, String or nil. Everything else in the
# file (comments, SET and LOCK statements) is skipped.
module Legacy
  class MysqlDumpReader
    class ParseError < StandardError; end

    ESCAPES = { "0" => "\0", "b" => "\b", "n" => "\n", "r" => "\r", "t" => "\t", "Z" => "\x1A" }.freeze

    def self.read(path)
      new(File.read(path, encoding: "UTF-8")).tables
    end

    def initialize(sql)
      @sql = sql
    end

    # { "people" => [ { "id" => 1, "firstName" => "Ann", ... }, ... ], ... }
    def tables
      columns = table_columns
      rows = Hash.new { |hash, table| hash[table] = [] }

      each_insert do |table, insert_columns, values|
        names = insert_columns || columns.fetch(table) { raise ParseError, "no CREATE TABLE for `#{table}`" }
        values.each do |row|
          unless row.size == names.size
            raise ParseError, "`#{table}` row has #{row.size} values for #{names.size} columns: #{row.inspect}"
          end
          rows[table] << names.zip(row).to_h
        end
      end

      rows.default_proc = nil
      rows
    end

    private
      def table_columns
        @sql.scan(/^CREATE TABLE `([^`]+)` \((.*?)^\)/m).to_h do |table, body|
          [ table, body.scan(/^\s*`([^`]+)`/).flatten ]
        end
      end

      def each_insert
        @pos = 0
        while (start = @sql.index(/^INSERT INTO `/, @pos))
          @pos = start + "INSERT INTO `".length
          table = read_until("`")
          skip_space
          insert_columns = (read_column_list if peek == "(")
          skip_space
          expect("VALUES")
          yield table, insert_columns, read_rows
        end
      end

      def read_column_list
        expect("(")
        list = read_until(")")
        list.scan(/`([^`]+)`/).flatten
      end

      def read_rows
        rows = []
        loop do
          skip_space
          expect("(")
          rows << read_row
          skip_space
          case next_char
          when "," then next
          when ";" then return rows
          else raise ParseError, "expected , or ; after a row at offset #{@pos}"
          end
        end
      end

      def read_row
        row = []
        loop do
          skip_space
          row << read_value
          skip_space
          case next_char
          when "," then next
          when ")" then return row
          else raise ParseError, "expected , or ) in a row at offset #{@pos}"
          end
        end
      end

      def read_value
        if peek == "'"
          read_string
        elsif @sql[@pos, 4].casecmp?("NULL")
          @pos += 4
          nil
        else
          token = @sql[@pos..][/\A[-+0-9.eE]+/] or raise ParseError, "unexpected value at offset #{@pos}"
          @pos += token.length
          token.match?(/[.eE]/) ? Float(token) : Integer(token, 10)
        end
      end

      def read_string
        @pos += 1
        out = +""
        loop do
          char = next_char or raise ParseError, "unterminated string"
          case char
          when "\\"
            escaped = next_char
            out << ESCAPES.fetch(escaped, escaped)
          when "'"
            if peek == "'" # '' inside a string is a quote
              @pos += 1
              out << "'"
            else
              return out
            end
          else
            out << char
          end
        end
      end

      def read_until(delimiter)
        finish = @sql.index(delimiter, @pos) or raise ParseError, "missing #{delimiter.inspect}"
        text = @sql[@pos...finish]
        @pos = finish + delimiter.length
        text
      end

      def expect(text)
        raise ParseError, "expected #{text} at offset #{@pos}" unless @sql[@pos, text.length] == text

        @pos += text.length
      end

      def skip_space
        @pos += 1 while @sql[@pos]&.match?(/\s/)
      end

      def peek
        @sql[@pos]
      end

      def next_char
        char = @sql[@pos]
        @pos += 1
        char
      end
  end
end
