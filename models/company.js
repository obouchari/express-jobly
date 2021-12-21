"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const { isEmpty, isNil, toNumber } = require("lodash");
const { quiet } = require("nodemon/lib/utils");
const { max } = require("pg/lib/defaults");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [handle, name, description, numEmployees, logoUrl]
    );
    const company = result.rows[0];

    return company;
  }

  /**
   * Find all companies. Or, Find by certain filter parameters passed to the function
   * @param filterObj {{name: String, minEmployees: Number, maxEmployees: Number}}
   * @returns {Promise<*>} [{ handle, name, description, numEmployees, logoUrl }, ...]
   */

  static async findAll(filterObj = {}) {
    let { name, minEmployees, maxEmployees } = filterObj;
    const params = [];
    const whereClause = [];

    // If the minEmployees parameter is greater than the maxEmployees parameter,
    // respond with a 400 error with an appropriate message.
    if (
      !isNil(minEmployees) &&
      !isNaN(minEmployees) &&
      !isNil(maxEmployees) &&
      !isNaN(maxEmployees) &&
      minEmployees > maxEmployees
    ) {
      throw new BadRequestError(
        "minEmployees cannot be greater than the maxEmployees"
      );
    }

    if (!isEmpty(filterObj)) {
      // Build the where clause and the params to be passed to the db.query function.
      if (!isNil(name)) {
        whereClause.push(`name iLIKE $1`);
        params.push(`%${name}%`);
      }

      if (!isNil(minEmployees)) {
        // Check if minEmployees is a valid number
        if (isNaN(minEmployees))
          throw new BadRequestError("minEmployees must be of type number");

        let placeholder = "1";
        if (!isEmpty(params)) {
          placeholder = params.length + 1;
        }
        whereClause.push(`num_employees >= $${placeholder}`);
        params.push(toNumber(minEmployees));
      }

      if (!isNil(maxEmployees)) {
        // Check if maxEmployees is a valid number
        if (isNaN(maxEmployees))
          throw new BadRequestError("maxEmployees must be of type number");

        let placeholder = "1";
        if (!isEmpty(params)) {
          placeholder = params.length + 1;
        }
        whereClause.push(`num_employees <= $${placeholder}`);
        params.push(toNumber(maxEmployees));
      }
    }

    const sqlQuery = `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies ${
             !isEmpty(whereClause) ? "WHERE " + whereClause.join(" AND ") : ""
           }
            ORDER BY name`;

    let companiesRes;
    if (isEmpty(params)) {
      companiesRes = await db.query(sqlQuery);
      return companiesRes.rows;
    }

    companiesRes = await db.query(sqlQuery, params);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]
    );
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}

module.exports = Company;
