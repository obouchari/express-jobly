"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const types = require("pg").types;
const { getDatabaseUri } = require("./config");

let db;

types.setTypeParser(1700, (val) => parseFloat(val));

db = new Client(
  process.env.NODE_ENV === "production"
    ? {
        connectionString: getDatabaseUri(),
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {
        connectionString: getDatabaseUri(),
      }
);

db.connect();

module.exports = db;
