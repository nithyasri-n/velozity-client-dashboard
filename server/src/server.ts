import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import app from "./app";
import { prisma } from "./lib/prisma";
import { verifyAccessToken } from "./utils/jwt";
import { startOverdueJob } from "./jobs/overdue.job";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

// Track online users.
// The number represents how many active socket connections
// that user currently has.
const onlineUsers = new Map<number, number>();

function emitPresence() {
  io.to("admin:activity").emit("presence:update", {
    onlineCount: onlineUsers.size,
  });
}

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    const decoded = verifyAccessToken(token) as {
      userId: number;
      role: string;
    };

    socket.data.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch {
    next(new Error("Invalid or expired access token"));
  }
});

io.on("connection", async (socket) => {
  const { userId, role } = socket.data.user;

  console.log(
    `Socket connected: ${socket.id} | User: ${userId} | Role: ${role}`
  );

  // Register user as online
  const currentConnections = onlineUsers.get(userId) || 0;
  onlineUsers.set(userId, currentConnections + 1);

  socket.join(`user:${userId}`);

  if (role === "ADMIN") {
    socket.join("admin:activity");
  }

  if (role === "PROJECT_MANAGER") {
    const projects = await prisma.project.findMany({
      where: { managerId: userId },
      select: { id: true },
    });

    projects.forEach((project) => {
      socket.join(`project:${project.id}`);
    });
  }

  if (role === "DEVELOPER") {
    const tasks = await prisma.task.findMany({
      where: { developerId: userId },
      select: { id: true },
    });

    tasks.forEach((task) => {
      socket.join(`task:${task.id}`);
    });
  }

  // Send updated online count to Admins
  emitPresence();

  // Role-filtered last 20 activity events
  let where: any = {};

  if (role === "PROJECT_MANAGER") {
    where = {
      task: {
        project: {
          managerId: userId,
        },
      },
    };
  }

  if (role === "DEVELOPER") {
    where = {
      task: {
        developerId: userId,
      },
    };
  }

  const activities = await prisma.activityLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      task: {
        select: {
          id: true,
          title: true,
          projectId: true,
          developerId: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  socket.emit("activity:history", activities);

  socket.on("disconnect", () => {
    const currentConnections = onlineUsers.get(userId) || 1;

    if (currentConnections <= 1) {
      onlineUsers.delete(userId);
    } else {
      onlineUsers.set(userId, currentConnections - 1);
    }

    // Send updated online count to Admins
    emitPresence();

    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Start scheduled overdue-task background job
startOverdueJob();

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});