import { Router } from "express";

import {
  login,
  refreshAccessToken,
} from "../controllers/auth.controller";

import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

router.post("/login", login);

router.post("/refresh", refreshAccessToken);






export default router;