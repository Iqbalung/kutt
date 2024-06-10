import { Handler } from "express";
import query from "../queries";
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
      role: utils.isAdmin(user.email) ? "admin" : "user"
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
    password: req.body.password
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
    user.password = req.body.password;
  }

  if (req.body.banned && req.user.admin && req.user.id !== user.id) {
    const banned = req.body.banned === "true" || req.body.banned === true;
    user.banned = banned;
    user.banned_by_id = req.user.id;
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

  // verify is the user is an admin
  if (!req.user.admin) {
    throw new Error("You do not have permission to delete users.");
  }

  const user = await query.user.find({ id: userId });
  if (!user) {
    throw new Error("User not found.");
  }

  await query.user.remove(user);

  return res.status(200).send("OK");
};
