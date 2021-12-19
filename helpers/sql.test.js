const { sqlForPartialUpdate } = require("../helpers/sql");
const { BadRequestError } = require("../expressError");

describe("Object to SQL for partial updates ", function () {
  test("return the correct format", () => {
    const data = { firstName: "Zahra", age: 5 };
    const results = {
      setCols: '"first_name"=$1, "age"=$2',
      values: ["Zahra", 5],
    };
    expect(sqlForPartialUpdate(data, { firstName: "first_name" })).toEqual(
      results
    );
  });

  test("throws when provided an empty data object", () => {
    expect(() => sqlForPartialUpdate({})).toThrow(
      new BadRequestError("No data")
    );
  });
});
