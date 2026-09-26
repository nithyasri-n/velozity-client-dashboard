import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import taskRoutes from "./routes/task.routes";
import notificationRoutes from "./routes/notification.routes";

import authRoutes from "./routes/auth.routes";
import projectRoutes from "./routes/project.routes";
import activityRoutes from "./routes/activity.routes";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Velozity API is running",
  });
});

export default app;