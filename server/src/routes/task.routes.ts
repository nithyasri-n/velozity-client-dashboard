import { Router } from "express";

import {
  getTasks,
  createTask,
  updateTaskStatus,
} from "../controllers/task.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  authenticate,
  getTasks
);

router.post(
  "/",
  authenticate,
  createTask
);
router.patch(
  "/:id/status",
  authenticate,
  updateTaskStatus
);


export default router;