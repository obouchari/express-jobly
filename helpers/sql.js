const { BadRequestError } = require("../expressError");

/**
 * Return an object with a string representation of the columns with placeholders,
 * and their values as an array with the same order as the placeholders.
 * @param dataToUpdate: {firstName: 'Aliya', age: 32}
 * @param jsToSql: {firstName: "first_name"}
 * @returns {{values: any[], setCols: string}} : {
 *       setCols: '"first_name"=$1, "age"=$2',
 *       values: ["Aliya", 32],
 *     }
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql = {}) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
