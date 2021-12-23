"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  getJobId,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", () => {
  const newJob = {
    title: "new",
    salary: 4000,
    equity: 0.5,
    companyHandle: "c1",
  };

  test("works", async () => {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      ...newJob,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'new'`
    );
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "new",
        salary: 4000,
        equity: 0.5,
        companyHandle: "c1",
      },
    ]);
  });
});

/************************************** findAll */

describe("findAll", () => {
  test("works: no filter", async () => {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Back-End Developer",
        salary: 120000,
        equity: 0.4,
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "Front-End Developer",
        salary: 110000,
        equity: 0,
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "Project Manager",
        salary: null,
        equity: null,
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "UX Designer",
        salary: 60000,
        equity: 0.1,
        companyHandle: "c1",
      },
    ]);
  });
});

/************************************** findAll with filter */

describe("findAll with filters", () => {
  test("works: with all filters", async () => {
    let jobs = await Job.findAll({
      title: "ux",
      minSalary: 50000,
      hasEquity: true,
    });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "UX Designer",
        salary: 60000,
        equity: 0.1,
        companyHandle: "c1",
      },
    ]);
  });

  test("works: with title filter", async () => {
    let jobs = await Job.findAll({
      title: "ux",
    });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "UX Designer",
        salary: 60000,
        equity: 0.1,
        companyHandle: "c1",
      },
    ]);
  });

  test("works: with minSalary filter", async () => {
    let jobs = await Job.findAll({
      minSalary: 110000,
    });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Back-End Developer",
        salary: 120000,
        equity: 0.4,
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "Front-End Developer",
        salary: 110000,
        equity: 0,
        companyHandle: "c2",
      },
    ]);
  });

  test("throws: when minSalary is not a valid number", async () => {
    await expect(
      Job.findAll({
        minSalary: "abc",
      })
    ).rejects.toThrow();
  });

  test("works: with hasEquity filter set to true", async () => {
    let jobs = await Job.findAll({
      hasEquity: true,
    });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Back-End Developer",
        salary: 120000,
        equity: 0.4,
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "UX Designer",
        salary: 60000,
        equity: 0.1,
        companyHandle: "c1",
      },
    ]);
  });

  test("works: with hasEquity filter set to false", async () => {
    let jobs = await Job.findAll({
      hasEquity: false,
    });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Back-End Developer",
        salary: 120000,
        equity: 0.4,
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "Front-End Developer",
        salary: 110000,
        equity: 0,
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "Project Manager",
        salary: null,
        equity: null,
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "UX Designer",
        salary: 60000,
        equity: 0.1,
        companyHandle: "c1",
      },
    ]);
  });
});

/************************************** get */

describe("get", () => {
  test("works", async () => {
    const jobId = await getJobId();
    let job = await Job.get(jobId);
    expect(job).toEqual({
      id: jobId,
      title: "UX Designer",
      salary: 60000,
      equity: 0.1,
      companyHandle: "c1",
    });
  });

  test("not found if no such job", async () => {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", () => {
  const updateData = {
    title: "UI/UX Designer",
    salary: 70000,
    equity: 0.2,
  };

  test("works", async () => {
    const jobId = await getJobId();
    let job = await Job.update(jobId, updateData);
    expect(job).toEqual({
      id: jobId,
      ...updateData,
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [jobId]
    );
    expect(result.rows).toEqual([
      {
        id: jobId,
        ...updateData,
        companyHandle: "c1",
      },
    ]);
  });

  test("works: null fields", async () => {
    const jobId = await getJobId();
    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null,
    };

    let job = await Job.update(jobId, updateDataSetNulls);
    expect(job).toEqual({
      id: jobId,
      ...updateDataSetNulls,
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [jobId]
    );
    expect(result.rows).toEqual([
      {
        id: jobId,
        title: "New",
        salary: null,
        equity: null,
        companyHandle: "c1",
      },
    ]);
  });

  test("not found if no such job", async () => {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async () => {
    try {
      const jobId = await getJobId();
      await Job.update(jobId, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", () => {
  test("works", async () => {
    const jobId = await getJobId();
    await Job.remove(jobId);
    const res = await db.query("SELECT id FROM jobs WHERE id=$1", [jobId]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async () => {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
