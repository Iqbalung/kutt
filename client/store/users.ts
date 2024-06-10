import { action, Action, thunk, Thunk } from "easy-peasy";
import axios from "axios";
import query from "query-string";

import { getAxiosConfig } from "../utils";
import { APIv2 } from "../consts";

export interface User {
  id: number;
  email: string;
  role: string;
  links: number;
  banned: boolean;
  created_at: string;
  updated_at: string;
  isSelected?: boolean;
}

export interface NewUser {
  email: string;
  password: string;
}

export interface BanUser {
  id: number;
}

export interface EditUser {
  id: number;
  email?: string;
  password?: string;
  banned?: boolean;
}

export interface UsersQuery {
  limit: string;
  skip: string;
  search: string;
  all: boolean;
}

export interface UsersListRes {
  data: User[];
  total: number;
  limit: number;
  skip: number;
}

export interface Users {
  user?: User;
  items: User[];
  total: number;
  loading: boolean;
  create: Thunk<Users, NewUser>;
  get: Thunk<Users, UsersQuery>;
  add: Action<Users, User>;
  set: Action<Users, UsersListRes>;
  update: Thunk<Users, EditUser>;
  remove: Thunk<Users, number>;
  setLoading: Action<Users, boolean>;
}

export const users: Users = {
  user: null,
  items: [],
  total: 0,
  loading: true,
  create: thunk(async (actions, payload) => {
    const { data } = await axios.post(
      `${APIv2.Users}/create`,
      payload,
      getAxiosConfig()
    );

    // actions.add(data);
  }),
  get: thunk(async (actions, payload) => {
    actions.setLoading(true);
    const res = await axios.get(
      `${APIv2.Users}/all?${query.stringify(payload)}`,
      getAxiosConfig()
    );
    actions.set(res.data);
    actions.setLoading(false);
    return res.data;
  }),
  remove: thunk(async (actions, id) => {
    await axios.delete(`${APIv2.Users}/delete/${id}`, getAxiosConfig());
  }),
  update: thunk(async (actions, payload) => {
    await axios.patch(
      `${APIv2.Users}/${payload.id}`,
      payload,
      getAxiosConfig()
    );
  }),
  add: action((state, payload) => {
    state.items.unshift(payload);
  }),
  set: action((state, payload) => {
    state.items = payload.data;
    state.total = payload.total;
  }),
  setLoading: action((state, payload) => {
    state.loading = payload;
  })
};
