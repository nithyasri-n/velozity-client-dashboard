import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { prisma } from "../lib/prisma";
import { io } from "../server";

export async function getTasks(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { userId, role } = req.user;
    const { status, priority, dueDate } = req.query;

    const where: any = {};

    if (role === "DEVELOPER") {
      where.developerId = userId;
    } else if (role === "PROJECT_MANAGER") {
      where.project = {
        managerId: userId,
      };
    }

    if (status) {
      where.status = String(status);
    }

    if (priority) {
      where.priority = String(priority);
    }

    if (dueDate) {
      const date = new Date(String(dueDate));

      where.dueDate = {
        gte: date,
        lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            managerId: true,
          },
        },
        developer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        {
          priority: "desc",
        },
        {
          dueDate: "asc",
        },
      ],
    });

    return res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
    });
  }
}

export async function createTask(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { userId, role } = req.user;

    if (role !== "ADMIN" && role !== "PROJECT_MANAGER") {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to create tasks",
      });
    }

    const {
      title,
      description,
      projectId,
      developerId,
      priority,
      dueDate,
    } = req.body;

    if (!title || !projectId || !developerId) {
      return res.status(400).json({
        success: false,
        message: "Title, projectId and developerId are required",
      });
    }

    const project = await prisma.project.findUnique({
      where: {
        id: Number(projectId),
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (
      role === "PROJECT_MANAGER" &&
      project.managerId !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only create tasks in your own projects",
      });
    }

    const developer = await prisma.user.findFirst({
      where: {
        id: Number(developerId),
        role: "DEVELOPER",
      },
    });

    if (!developer) {
      return res.status(404).json({
        success: false,
        message: "Developer not found",
      });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        projectId: Number(projectId),
        developerId: Number(developerId),
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        developer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create activity log
    const activity = await prisma.activityLog.create({
      data: {
        action: "TASK_CREATED",
        details: `Created task "${task.title}" and assigned it to ${developer.name}`,
        taskId: task.id,
        userId,
      },
    });

    // Real-time activity feed
    io.to("admin:activity").emit("activity:new", activity);
    io.to(`project:${task.projectId}`).emit("activity:new", activity);
    io.to(`task:${task.id}`).emit("activity:new", activity);

    // Store assignment notification in database
    const notification = await prisma.notification.create({
      data: {
        userId: developer.id,
        message: `You have been assigned a new task: "${task.title}"`,
      },
    });

    // Real-time notification to assigned developer
    io.to(`user:${developer.id}`).emit(
      "notification:new",
      notification
    );

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create task",
    });
  }
}

export async function updateTaskStatus(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { userId, role } = req.user;
    const taskId = Number(req.params.id);
    const { status } = req.body;

    const allowedStatuses = [
      "TODO",
      "IN_PROGRESS",
      "IN_REVIEW",
      "DONE",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status",
      });
    }

    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (
      role === "DEVELOPER" &&
      task.developerId !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update tasks assigned to you",
      });
    }

    if (
      role === "PROJECT_MANAGER" &&
      task.project.managerId !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update tasks in your own projects",
      });
    }

    const oldStatus = task.status;

    if (oldStatus === status) {
      return res.status(400).json({
        success: false,
        message: "Task is already in this status",
      });
    }

    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        status,
      },
    });

    // Save activity log
    const activity = await prisma.activityLog.create({
      data: {
        action: "TASK_STATUS_CHANGED",
        details: `Moved Task #${task.id} from ${oldStatus} → ${status}`,
        taskId: task.id,
        userId,
      },
    });

    // Real-time activity feed
    io.to("admin:activity").emit("activity:new", activity);
    io.to(`project:${task.projectId}`).emit(
      "activity:new",
      activity
    );
    io.to(`task:${task.id}`).emit("activity:new", activity);

    // Notify Project Manager when task enters In Review
    if (
      status === "IN_REVIEW" &&
      task.project.managerId !== userId
    ) {
      const notification = await prisma.notification.create({
        data: {
          userId: task.project.managerId,
          message: `Task #${task.id} "${task.title}" is now In Review`,
        },
      });

      // Real-time notification to Project Manager
      io.to(`user:${task.project.managerId}`).emit(
        "notification:new",
        notification
      );
    }

    return res.json({
      success: true,
      message: "Task status updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update task status",
    });
  }
}

