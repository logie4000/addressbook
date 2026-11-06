# Moving the old MariaDB data into DynamoDB

A one-time import of the old MariaDB address book into the DynamoDB tables.
It reads a SQL dump file directly, so no database server is needed, and it
can be run again safely: every old id always becomes the same new id, so a
second run overwrites instead of making copies.

The dump holds real names and addresses. Keep it out of the repository.

## 1. Make the dump

On the machine running MariaDB:

```sh
mariadb-dump --single-transaction \
  addressbook addresses people > legacy.sql
```

(`mysqldump` takes the same options.) A dump of the whole database works too;
only the `addresses` and `people` tables are read.

## 2. Get a shell that can run the task

The task runs Rails from the `api` folder. Either:

- **Ruby 3.4 installed:** `cd api && bundle install`, then run the commands
  below as written.
- **Docker only** (works on Windows too). From the repository root, start a
  shell with your AWS credentials mounted read-only:

  ```sh
  # Linux / macOS
  docker run --rm -it -v "$PWD":/app -v "$HOME/.aws":/root/.aws:ro -w /app/api ruby:3.4.12 bash
  # Windows (cmd)
  docker run --rm -it -v "%cd%":/app -v "%USERPROFILE%\.aws":/root/.aws:ro -w /app/api ruby:3.4.12 bash
  ```

  Inside it, run `bundle install` once, then the commands below. Copy the
  dump into the repository folder first (for example as `legacy.sql` at the
  root, which makes it `../legacy.sql` from `api`). Delete it when you're done.

The credentials need read and write access to the two DynamoDB tables. The
ones you use for `sam deploy` have it.

## 3. Dry run: see what would be imported

```sh
bin/rails "legacy:import[../legacy.sql]" DRY_RUN=1
```

Nothing is written. The report has two parts:

- **Changed**: clean-up applied on the way in. Spaces are trimmed and blank
  values left empty. Links to rows that don't exist are dropped. Each
  household is made whole, the way the app saves one: the spouse and
  children get the household's address, the spouse link points both ways,
  children recorded under the spouse move to the addressee, and a child with
  no last name takes the household's (or, if a full name was typed into the
  first-name box, it is split). People who still belong to no household
  (no address, and not anyone's spouse or child) are left out. Last sent,
  which the old app kept as a year, becomes a date: December 21 of that
  year.
- **For review (imported as is)**: things that look wrong but are kept,
  such as placeholder names ("New child", "Spouse") and names or street
  addresses that appear twice.

To leave people out, list their old ids (the `#` numbers in the report):

```sh
bin/rails "legacy:import[../legacy.sql]" DRY_RUN=1 SKIP=11,12,248
```

Links to skipped people are dropped too. Use the same `SKIP` on every
command below.

## 4. Try it locally (optional)

With DynamoDB Local running (see the API README), set
`DYNAMODB_ENDPOINT=http://localhost:8000` and run the import without
`DRY_RUN`. Start the app and look around, then undo it with
`legacy:rollback`.

## 5. Import into AWS

The commands refuse to touch real AWS tables unless `CONFIRM` names the
table prefix, so a stray command can't change production.

```sh
export DYNAMODB_TABLE_PREFIX=addressbook_production AWS_REGION=us-east-1
bin/rails "legacy:import[../legacy.sql]" CONFIRM=addressbook_production SKIP=...
```

It writes the addresses and people, reads every record back and checks it.
It ends with `Imported and verified 79 addresses and 250 people.` or a list
of problems.

If the tables already hold records you entered in the new app, it stops and
says how many. `OVERWRITE=1` imports alongside them; they are kept.

## Checking and undoing

```sh
bin/rails "legacy:verify[../legacy.sql]"       # compare the tables with the dump
bin/rails "legacy:rollback[../legacy.sql]" CONFIRM=addressbook_production
```

Rollback deletes exactly the records the dump created and nothing else, so
records added in the app stay. Edits made in the app to imported records are
lost on rollback, and overwritten by a second import.

## How ids are made

The old integer ids become UUIDs (version 5) derived from a fixed namespace
in `api/lib/legacy/mariadb_importer.rb`. Never change that namespace: a
re-run would then create a second copy of everything.
