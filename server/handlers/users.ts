import { Handler } from "express";
import query from "../queries";
import bcrypt from "bcryptjs";
import * as utils from "../utils";
import passport from "passport";
import bcrypt from "bcryptjs";


export const get = async (req, res) => {
  const domains = await query.domain.get({ user_id: req.user.id });

  const data = {
    apikey: req.user.apikey,
    email: req.user.email,
    domains: domains.map(utils.sanitize.domain)
  };

  return res.status(200).send(data);
};

export const getUsers: Handler = async (req, res) => {
  const { limit, skip } = req.context;
  const search = req.query.search as string;

  const [users, total] = await Promise.all([
    query.user.get({}, { limit, search, skip }),
    query.user.total({}, { search })
  ]);

  const data = users.map(utils.sanitize.user).map((user) => {
    return {
      ...user,
      role: utils.isAdmin(user) ? "admin" : "user"
    };
  });

  return res.send({
    total,
    limit,
    skip,
    data
  });
};

export const create: Handler = async (req, res) => {
  const salt = await bcrypt.genSalt(12);
  const password = await bcrypt.hash(req.body.password, salt);

  const user = await query.user.add({
    email: req.body.email,
    password: password,
    verified: true,
    role: req.body.role || "user"
  });

  return res.status(201).send({
    apikey: user.apikey,
    email: user.email,
    domains: []
  });
};

export const edit: Handler = async (req, res) => {
  const user = await query.user.find({ id: req.body.id });

  if (!user) {
    throw new Error("User not found.");
  }

  if (req.body.email && req.body.email !== user.email) {
    user.email = req.body.email;
  }

  if (req.body.password) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(req.body.password, salt);
  }

  if (typeof req.body.banned !== "undefined" && req.body.banned !== null) {
    if (req.user.id === user.id) {
      throw new utils.CustomError("You cannot ban yourself.");
    }

    const banned = req.body.banned === "true" || req.body.banned === true;
    user.banned = banned;
    user.banned_by_id = req.user.id;
  }

  if (req.body.role) {
    const validRoles = ["user", "admin"];
    if (!validRoles.includes(req.body.role)) {
      throw new utils.CustomError("Invalid role.");
    }

    if (req.user.id === user.id) {
      throw new utils.CustomError("You cannot change your own role.");
    }

    user.role = req.body.role;
  }

  await query.user.update({ id: user.id }, user);

  return res.status(200).send("OK");
};

export const remove = async (req, res) => {
  await query.user.remove(req.user);
  return res.status(200).send("OK");
};

export const removeById: Handler = async (req, res) => {
  // verify that the user is not trying to delete themselves
  const userId = parseInt(req.params.id, 10);
  if (req.user.id === userId) {
    throw new Error("You cannot delete yourself.");
  }

  const user = await query.user.find({ id: userId });
  if (!user) {
    throw new Error("User not found.");
  }

  await query.user.remove(user);

  return res.status(200).send("OK");
};
