-- psql -U postgres -d postgres -a -f create_database.sql
-- heroku pg:psql --app app_name < file.sql
DROP TABLE readmeter_model_table;

CREATE TABLE readmeter_model_table(
   id SERIAL,
   model JSONB,
   PRIMARY KEY(id)
);
--CREATE TABLE readmeter_data_table(
--  id SERIAL,
--  PRIMARY KEY(id)
--);