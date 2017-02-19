-- psql -U postgres -d postgres -a -f create_database.sql
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