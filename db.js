"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const types = require("pg").types;
const { getDatabaseUri } = require("./config");

let db;

types.setTypeParser(1700, (val) => parseFloat(val));

if (process.env.NODE_ENV === "production") {
  db = new Client({
    connectionString: getDatabaseUri(),
    ssl: {
      rejectUnauthorized: false,
    },
  });
} else {
  db = new Client({
    connectionString: getDatabaseUri(),
  });
}

db.connect();

module.exports = db;
