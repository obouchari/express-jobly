"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const { isEmpty, isNil, toNumber } = require("lodash");
// const { quiet } = require("nodemon/lib/utils");
// const { max } = require("pg/lib/defaults");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   * data should be { title, salary, equity, companyHandle }
   * Returns { id, title, salary, equity, companyHandle }
   * */
  static async create({ title, salary, equity, companyHandle }) {
    const result = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    return result.rows[0];
  }

  /**
   * Find all jobs. Or, Find by certain filter parameters passed to the function
   * @param filterObj {{title: String, minSalary: Number, hasEquity: Boolean}}
   * @returns {Promise<*>} [{ id, title, salary, equity, companyHandle }, ...]
   */

  static async findAll(filterObj = {}) {
    let { title, minSalary, hasEquity } = filterObj;
    const params = [];
    const whereClause = [];

    if (!isEmpty(filterObj)) {
      // Build the where clause and the params to be passed to the db.query function.
      if (!isNil(title)) {
        whereClause.push(`title iLIKE $1`);
        params.push(`%${title}%`);
      }

      if (!isNil(minSalary)) {
        // Check if minSalary is a valid number
        if (isNaN(minSalary))
          throw new BadRequestError("minSalary must be of type number");

        let placeholder = "1";
        if (!isEmpty(params)) {
          placeholder = params.length + 1;
        }
        whereClause.push(`salary >= $${placeholder}`);
        params.push(toNumber(minSalary));
      }

      if (hasEquity === true) {
        whereClause.push(`equity > 0`);
      }
    }

    const sqlQuery = `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs ${
             !isEmpty(whereClause) ? "WHERE " + whereClause.join(" AND ") : ""
           }
            ORDER BY title`;

    let query = {
      text: sqlQuery,
    };

    if (!isEmpty(params)) {
      query = { ...query, values: params };
    }

    const jobsRes = await db.query(query);
    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [id]
    );

    const [job] = jobRes.rows;
    if (!job) throw new NotFoundError(`No job: ${id}`);
    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data);
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const [job] = result.rows;
    if (!job) throw new NotFoundError(`No job: ${id}`);
    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const [job] = result.rows;
    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
