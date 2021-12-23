"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
  getJobId,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new title",
    salary: 100000,
    equity: 0,
    companyHandle: "c1",
  };

  test("ok for user with admin role", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: { ...newJob, id: expect.any(Number) },
    });
  });

  test("Unauthorized when user doesn't have admin role", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      error: {
        message: "Unauthorized",
        status: 401,
      },
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new title",
        salary: 100000,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        salary: "not-a-number",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok when no filters are present", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
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
      ],
    });
  });

  test("ok when all filters are present", async function () {
    const resp = await request(app).get(
      "/jobs?title=dev&minSalary=115000&hasEquity=true"
    );
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "Back-End Developer",
          salary: 120000,
          equity: 0.4,
          companyHandle: "c1",
        },
      ],
    });
  });

  test("ok when some filters are present", async function () {
    const resp = await request(app).get("/jobs?title=dev");
    expect(resp.body).toEqual({
      jobs: [
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
      ],
    });
  });

  test("return 400 when passing invalid query params", async function () {
    const resp = await request(app).get("/jobs?notSupported=abc");
    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      error: {
        message: "Query notSupported is not supported.",
        status: 400,
      },
    });
  });

  test("return correct message format when passing multiple invalid query params", async function () {
    const resp = await request(app).get(
      "/jobs?notSupported=abc&anotherUnsupported=xyz"
    );
    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      error: {
        message: "Queries notSupported, anotherUnsupported are not supported.",
        status: 400,
      },
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const jobId = await getJobId();
    const resp = await request(app).get(`/jobs/${jobId}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "UX Designer",
        salary: 60000,
        equity: 0.1,
        companyHandle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for users", async function () {
    const jobId = await getJobId();
    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({
        title: "UI/UX Designer",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "UI/UX Designer",
        salary: 60000,
        equity: 0.1,
        companyHandle: "c1",
      },
    });
  });

  test("Unauthorized when user doesn't have admin role", async function () {
    const jobId = await getJobId();
    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({
        title: "UI/UX Designer",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      error: {
        message: "Unauthorized",
        status: 401,
      },
    });
  });

  test("unauth for anon", async function () {
    const jobId = await getJobId();
    const resp = await request(app).patch(`/jobs/${jobId}`).send({
      title: "UI/UX Designer",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "UI/UX Designer",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on company handle change attempt", async function () {
    const jobId = await getJobId();
    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({
        companyHandle: "c3",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const jobId = await getJobId();
    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({
        salary: "not-a-number",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for users", async function () {
    const jobId = await getJobId();
    const resp = await request(app)
      .delete(`/jobs/${jobId}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: jobId });
  });

  test("Unauthorized when user doesn't have admin role", async function () {
    const jobId = await getJobId();
    const resp = await request(app)
      .delete(`/jobs/${jobId}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      error: {
        message: "Unauthorized",
        status: 401,
      },
    });
  });

  test("unauth for anon", async function () {
    const jobId = await getJobId();
    const resp = await request(app).delete(`/jobs/${jobId}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
