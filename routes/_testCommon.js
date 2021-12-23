"use strict";

const db = require("../db");
const User = require("../models/user");
const Company = require("../models/company");
const { createToken } = require("../helpers/tokens");
const Job = require("../models/job");

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");

  await Company.create({
    handle: "c1",
    name: "C1",
    numEmployees: 1,
    description: "Desc1",
    logoUrl: "http://c1.img",
  });

  await Company.create({
    handle: "c2",
    name: "C2",
    numEmployees: 2,
    description: "Desc2",
    logoUrl: "http://c2.img",
  });

  await Company.create({
    handle: "c3",
    name: "C3",
    numEmployees: 3,
    description: "Desc3",
    logoUrl: "http://c3.img",
  });

  await User.register({
    username: "admin",
    firstName: "AdminFN",
    lastName: "AdminLN",
    email: "admin@mail.com",
    password: "adminpass",
    isAdmin: true,
  });

  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });

  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });

  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });

  await Job.create({
    title: "UX Designer",
    salary: 60000,
    equity: 0.1,
    companyHandle: "c1",
  });

  await Job.create({
    title: "Front-End Developer",
    salary: 110000,
    equity: 0,
    companyHandle: "c2",
  });

  await Job.create({
    title: "Back-End Developer",
    salary: 120000,
    equity: 0.4,
    companyHandle: "c1",
  });

  await Job.create({
    title: "Project Manager",
    salary: null,
    equity: null,
    companyHandle: "c2",
  });
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

const adminToken = createToken({ username: "admin", isAdmin: true });
const u1Token = createToken({ username: "u1", isAdmin: false });

const getJobId = async (title = "UX Designer") => {
  const result = await db.query(`SELECT id FROM jobs WHERE title=$1`, [title]);
  const job = result.rows[0];
  return job.id;
};

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
  getJobId,
};
