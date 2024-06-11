import { Router } from "express";
import asyncHandler from "express-async-handler";

import * as validators from "../handlers/validators";
import * as helpers from "../handlers/helpers";
import * as user from "../handlers/users";
import * as auth from "../handlers/auth";

const router = Router();

router.get(
  "/",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  asyncHandler(user.get)
);

router.get(
  "/all",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  helpers.admin,
  helpers.query,
  asyncHandler(user.getUsers)
);

router.post(
  "/create",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  helpers.admin,
  validators.createUser,
  asyncHandler(helpers.verify),
  asyncHandler(user.create)
);

router.patch(
  "/:id",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  helpers.admin,
  validators.editUser,
  asyncHandler(helpers.verify),
  asyncHandler(user.edit)
);

router.delete(
  "/delete/:id",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  helpers.admin,
  validators.deleteUserWithId,
  asyncHandler(helpers.verify),
  asyncHandler(user.removeById)
);

router.post(
  "/delete",
  asyncHandler(auth.apikey),
  asyncHandler(auth.jwt),
  validators.deleteUser,
  asyncHandler(helpers.verify),
  asyncHandler(user.remove)
);

export default router;
