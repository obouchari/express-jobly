"use strict";
/** Database setup for jobly. */
const { Client, types } = require("pg");
const { getDatabaseUri } = require("./config");

types.setTypeParser(1700, (val) => parseFloat(val));

const db = new Client(
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
