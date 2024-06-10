import { v4 as uuid } from "uuid";
import { addMinutes } from "date-fns";

import redisCLient, * as redis from "../redis";
import knex from "../knex";

const selectable = [
  "users.id",
  "users.banned",
  "users.email",
  "users.apikey",
  "users.created_at",
  "users.updated_at"
];

interface TotalParams {
  search?: string;
}

export const total = async (match: Partial<User>, params: TotalParams = {}) => {
  const query = knex<User>("users");

  Object.entries(match).forEach(([key, value]) => {
    query.andWhere(key, ...(Array.isArray(value) ? value : [value]));
  });

  if (params.search) {
    query.andWhereRaw("users.email ILIKE '%' || ? || '%'", [params.search]);
  }

  const [{ count }] = await query.count("id");

  return typeof count === "string" ? parseInt(count) : count;
};

interface GetParams {
  limit: number;
  search?: string;
  skip: number;
}

export const get = async (match: Partial<User>, params: GetParams) => {
  const query = knex<User>("users")
    .select(selectable)
    .where(match)
    .offset(params.skip)
    .limit(params.limit);

  if (params.search) {
    query.andWhereRaw("users.email ILIKE '%' || ? || '%'", [params.search]);
  }

  const users: UserJoinedLink[] = (await query) as unknown as UserJoinedLink[];

  // count users links
  const links = await knex<Link>("links")
    .select("user_id", knex.raw("count(*)"))
    .whereIn(
      "user_id",
      users.map((u) => u.id)
    )
    .groupBy("user_id");

  users.forEach((user) => {
    const link = links.find((l) => l.user_id === user.id);
    user.links = link ? parseInt(link["count"]) : 0;
  });

  return users;
};

export const find = async (match: Partial<User>) => {
  if (match.email || match.apikey) {
    const key = redis.key.user(match.email || match.apikey);
    const cachedUser = await redisCLient.get(key);
    if (cachedUser) return JSON.parse(cachedUser) as User;
  }

  const user = await knex<User>("users").where(match).first();

  if (user) {
    const emailKey = redis.key.user(user.email);
    redisCLient.set(emailKey, JSON.stringify(user), "EX", 60 * 60 * 1);

    if (user.apikey) {
      const apikeyKey = redis.key.user(user.apikey);
      redisCLient.set(apikeyKey, JSON.stringify(user), "EX", 60 * 60 * 1);
    }
  }

  return user;
};

interface Add {
  email: string;
  password: string;
}

export const add = async (params: Add, user?: User) => {
  const data = {
    email: params.email,
    password: params.password,
    verification_token: uuid(),
    verified: true,
    verification_expires: addMinutes(new Date(), 60).toISOString()
  };

  if (user) {
    await knex<User>("users")
      .where("id", user.id)
      .update({ ...data, updated_at: new Date().toISOString() });
  } else {
    await knex<User>("users").insert(data);
  }

  redis.remove.user(user);

  return {
    ...user,
    ...data
  };
};

export const update = async (match: Match<User>, update: Partial<User>) => {
  const query = knex<User>("users");

  Object.entries(match).forEach(([key, value]) => {
    query.andWhere(key, ...(Array.isArray(value) ? value : [value]));
  });

  const users = await query.update(
    { ...update, updated_at: new Date().toISOString() },
    "*"
  );

  users.forEach(redis.remove.user);

  return users;
};

export const remove = async (user: User) => {
  const deletedUser = await knex<User>("users").where("id", user.id).delete();

  redis.remove.user(user);

  return !!deletedUser;
};
