import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { prisma } from "../lib/prisma";

export async function getProjects(
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

    let projects;

    if (role === "ADMIN") {
      projects = await prisma.project.findMany({
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tasks: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else if (role === "PROJECT_MANAGER") {
      projects = await prisma.project.findMany({
        where: {
          managerId: userId,
        },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tasks: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      projects = await prisma.project.findMany({
        where: {
          tasks: {
            some: {
              developerId: userId,
            },
          },
        },
        include: {
          tasks: {
            where: {
              developerId: userId,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return res.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
}