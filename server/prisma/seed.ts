import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
});
const adapter = new PrismaPg(pool);



const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.activityLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  const passwordHash = await bcrypt.hash("Password@123", 10);

  await prisma.user.createMany({
    data: [
      {
        name: "Admin User",
        email: "admin@velozity.com",
        passwordHash,
        role: "ADMIN",
      },
      {
        name: "Ravi Manager",
        email: "ravi.pm@velozity.com",
        passwordHash,
        role: "PROJECT_MANAGER",
      },
      {
        name: "Priya Manager",
        email: "priya.pm@velozity.com",
        passwordHash,
        role: "PROJECT_MANAGER",
      },
      {
        name: "Arun Developer",
        email: "arun.dev@velozity.com",
        passwordHash,
        role: "DEVELOPER",
      },
      {
        name: "Meena Developer",
        email: "meena.dev@velozity.com",
        passwordHash,
        role: "DEVELOPER",
      },
      {
        name: "Karthik Developer",
        email: "karthik.dev@velozity.com",
        passwordHash,
        role: "DEVELOPER",
      },
      {
        name: "Divya Developer",
        email: "divya.dev@velozity.com",
        passwordHash,
        role: "DEVELOPER",
      },
    ],
  });

    const ravi = await prisma.user.findUniqueOrThrow({
    where: { email: "ravi.pm@velozity.com" },
  });

  const priya = await prisma.user.findUniqueOrThrow({
    where: { email: "priya.pm@velozity.com" },
  });

  const arun = await prisma.user.findUniqueOrThrow({
    where: { email: "arun.dev@velozity.com" },
  });

  const meena = await prisma.user.findUniqueOrThrow({
    where: { email: "meena.dev@velozity.com" },
  });

  const karthik = await prisma.user.findUniqueOrThrow({
    where: { email: "karthik.dev@velozity.com" },
  });

  const divya = await prisma.user.findUniqueOrThrow({
    where: { email: "divya.dev@velozity.com" },
  });

  const project1 = await prisma.project.create({
    data: {
      name: "E-Commerce Platform",
      description: "Development of a scalable e-commerce platform.",
      clientName: "Nova Retail",
      managerId: ravi.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Banking Dashboard",
      description: "Secure dashboard for banking operations.",
      clientName: "FinCore Bank",
      managerId: ravi.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: "Healthcare Portal",
      description: "Patient and appointment management portal.",
      clientName: "CarePlus",
      managerId: priya.id,
    },
  });

    await prisma.task.createMany({
    data: [
      {
        title: "Design product listing",
        description: "Create responsive product listing UI.",
        status: "DONE",
        priority: "HIGH",
        dueDate: new Date("2026-09-15"),
        projectId: project1.id,
        developerId: arun.id,
      },
      {
        title: "Implement cart API",
        description: "Build shopping cart backend APIs.",
        status: "IN_PROGRESS",
        priority: "CRITICAL",
        dueDate: new Date("2026-09-28"),
        projectId: project1.id,
        developerId: meena.id,
      },
      {
        title: "Payment integration",
        description: "Integrate payment gateway.",
        status: "TODO",
        priority: "HIGH",
        dueDate: new Date("2026-10-05"),
        projectId: project1.id,
        developerId: karthik.id,
      },
      {
        title: "User authentication",
        description: "Implement secure customer authentication.",
        status: "IN_REVIEW",
        priority: "MEDIUM",
        dueDate: new Date("2026-09-27"),
        projectId: project1.id,
        developerId: divya.id,
      },
      {
        title: "Order history",
        description: "Create customer order history module.",
        status: "TODO",
        priority: "LOW",
        dueDate: new Date("2026-10-10"),
        projectId: project1.id,
        developerId: arun.id,
      },

      {
        title: "Account overview",
        description: "Build banking account overview.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate: new Date("2026-09-29"),
        projectId: project2.id,
        developerId: meena.id,
      },
      {
        title: "Transaction API",
        description: "Implement transaction APIs.",
        status: "DONE",
        priority: "CRITICAL",
        dueDate: new Date("2026-09-18"),
        projectId: project2.id,
        developerId: karthik.id,
      },
      {
        title: "Transfer module",
        description: "Implement secure money transfer.",
        status: "TODO",
        priority: "CRITICAL",
        dueDate: new Date("2026-10-02"),
        projectId: project2.id,
        developerId: divya.id,
      },
      {
        title: "Bank statement",
        description: "Generate downloadable statements.",
        status: "IN_REVIEW",
        priority: "MEDIUM",
        dueDate: new Date("2026-09-30"),
        projectId: project2.id,
        developerId: arun.id,
      },
      {
        title: "Notification service",
        description: "Implement banking notifications.",
        status: "TODO",
        priority: "LOW",
        dueDate: new Date("2026-10-08"),
        projectId: project2.id,
        developerId: meena.id,
      },

      {
        title: "Patient registration",
        description: "Build patient registration workflow.",
        status: "DONE",
        priority: "HIGH",
        dueDate: new Date("2026-09-16"),
        projectId: project3.id,
        developerId: divya.id,
      },
      {
        title: "Appointment booking",
        description: "Implement appointment scheduling.",
        status: "IN_PROGRESS",
        priority: "CRITICAL",
        dueDate: new Date("2026-09-26"),
        projectId: project3.id,
        developerId: arun.id,
      },
      {
        title: "Doctor dashboard",
        description: "Create doctor dashboard.",
        status: "TODO",
        priority: "HIGH",
        dueDate: new Date("2026-10-03"),
        projectId: project3.id,
        developerId: karthik.id,
      },
      {
        title: "Medical records",
        description: "Implement medical records module.",
        status: "IN_REVIEW",
        priority: "MEDIUM",
        dueDate: new Date("2026-09-25"),
        projectId: project3.id,
        developerId: meena.id,
      },
      {
        title: "Patient notifications",
        description: "Add appointment reminders.",
        status: "TODO",
        priority: "LOW",
        dueDate: new Date("2026-10-07"),
        projectId: project3.id,
        developerId: divya.id,
      },
    ],
  });

  console.log("Projects and tasks created successfully!");

  console.log("Seed users created successfully!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });