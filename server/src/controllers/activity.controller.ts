import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { prisma } from "../lib/prisma";

export async function getActivities(
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

    let where = {};

    // Admin can see all activities
    if (role === "ADMIN") {
      where = {};
    }

    // Project Manager can see activities
    // from their own projects
    else if (role === "PROJECT_MANAGER") {
      where = {
        task: {
          project: {
            managerId: userId,
          },
        },
      };
    }

    // Developer can see activities
    // only for tasks assigned to them
    else if (role === "DEVELOPER") {
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
            developerId: true,
            project: {
              select: {
                id: true,
                name: true,
                managerId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return res.json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error("Get activities error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch activities",
    });
  }
}