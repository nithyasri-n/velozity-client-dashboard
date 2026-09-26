import { Router } from "express";

import { getProjects } from "../controllers/project.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  authenticate,
  getProjects
);

export default router;