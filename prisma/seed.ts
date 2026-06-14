import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEMO_EMAIL = "demo@choplanner.local";
const DEMO_PASSWORD = "demo1234";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function main() {
  // Idempotente: borra el usuario demo (cascada borra todo lo suyo) y recrea.
  await db.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await db.user.create({
    data: {
      email: DEMO_EMAIL,
      firstName: "Demo",
      lastName: "Usuario",
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
    },
  });

  // ---------- Workspace: Trabajo ----------
  const trabajo = await db.workspace.create({
    data: {
      userId: user.id,
      name: "Trabajo",
      description: "Proyectos y tareas del día a día laboral.",
      color: "#534AB7",
      icon: "💼",
      position: 0,
    },
  });

  const sprint = await db.sprint.create({
    data: {
      workspaceId: trabajo.id,
      name: "Sprint de lanzamiento",
      goal: "Dejar lista la landing y la analítica para el lanzamiento.",
      description: "Primer sprint del trimestre.",
      startDate: daysFromNow(0),
      endDate: daysFromNow(14),
    },
  });

  await db.task.create({
    data: {
      workspaceId: trabajo.id,
      sprintId: sprint.id,
      title: "Diseñar la landing page",
      description: "Estructura, hero, sección de precios y footer.",
      weight: 8,
      status: "IN_PROGRESS",
      position: 0,
      dueDate: daysFromNow(3),
      subtasks: {
        create: [
          { title: "Hero con CTA", weight: 7, done: true, position: 0 },
          { title: "Sección de precios", weight: 6, done: true, position: 1 },
          { title: "Footer con enlaces", weight: 3, done: false, position: 2 },
          { title: "Modo oscuro", weight: 5, done: false, position: 3 },
        ],
      },
    },
  });

  await db.task.create({
    data: {
      workspaceId: trabajo.id,
      sprintId: sprint.id,
      title: "Configurar analítica",
      description: "Eventos clave y embudo de conversión.",
      weight: 5,
      status: "TODO",
      position: 0,
      dueDate: daysFromNow(6),
    },
  });

  await db.task.create({
    data: {
      workspaceId: trabajo.id,
      title: "Escribir documentación de la API",
      weight: 4,
      status: "TODO",
      position: 1,
      subtasks: {
        create: [
          { title: "Autenticación", weight: 6, done: false, position: 0 },
          { title: "Endpoints de tareas", weight: 5, done: false, position: 1 },
        ],
      },
    },
  });

  await db.task.create({
    data: {
      workspaceId: trabajo.id,
      title: "Reunión de kickoff con el cliente",
      description: "Alinear alcance y fechas.",
      weight: 6,
      status: "DONE",
      position: 0,
      dueDate: daysFromNow(-2),
    },
  });

  await db.note.create({
    data: {
      userId: user.id,
      workspaceId: trabajo.id,
      title: "Ideas de marketing",
      content:
        "# Ideas de marketing\n\n- Campaña en redes la semana del lanzamiento\n- **Newsletter** a la lista actual\n- Programa de referidos\n\n> Priorizar lo orgánico antes de invertir en ads.",
    },
  });

  // ---------- Workspace: Personal ----------
  const personal = await db.workspace.create({
    data: {
      userId: user.id,
      name: "Personal",
      description: "Recados y pendientes de la vida diaria.",
      color: "#1D9E75",
      icon: "🏠",
      position: 1,
    },
  });

  await db.task.create({
    data: {
      workspaceId: personal.id,
      title: "Renovar el pasaporte",
      description: "Pedir cita y juntar documentos.",
      weight: 7,
      status: "TODO",
      position: 0,
      dueDate: daysFromNow(10),
    },
  });

  await db.task.create({
    data: {
      workspaceId: personal.id,
      title: "Comprar regalo de cumpleaños",
      weight: 6,
      status: "IN_PROGRESS",
      position: 0,
      dueDate: daysFromNow(2),
    },
  });

  await db.task.create({
    data: {
      workspaceId: personal.id,
      title: "Terminar de leer 'Hábitos atómicos'",
      weight: 3,
      status: "TODO",
      position: 1,
      subtasks: {
        create: [
          { title: "Capítulo 3", weight: 3, done: true, position: 0 },
          { title: "Capítulo 4", weight: 3, done: false, position: 1 },
          { title: "Capítulo 5", weight: 3, done: false, position: 2 },
        ],
      },
    },
  });

  await db.note.create({
    data: {
      userId: user.id,
      workspaceId: personal.id,
      title: "Lista de compras",
      content: "- Café\n- Pan integral\n- Fruta\n- Detergente",
      reminderAt: daysFromNow(1),
    },
  });

  // ---------- Workspace: Gimnasio ----------
  const gimnasio = await db.workspace.create({
    data: {
      userId: user.id,
      name: "Gimnasio",
      description: "Plan de entrenamiento y seguimiento.",
      color: "#D85A30",
      icon: "🏋️",
      position: 2,
    },
  });

  await db.task.create({
    data: {
      workspaceId: gimnasio.id,
      title: "Rutina de fuerza — Semana 1",
      description: "Enfoque en básicos compuestos.",
      weight: 6,
      status: "IN_PROGRESS",
      position: 0,
      subtasks: {
        create: [
          { title: "Sentadillas 4x8", weight: 7, done: true, position: 0 },
          { title: "Press de banca 4x8", weight: 6, done: true, position: 1 },
          { title: "Peso muerto 3x5", weight: 8, done: false, position: 2 },
          { title: "Dominadas 3x máx", weight: 5, done: false, position: 3 },
        ],
      },
    },
  });

  await db.task.create({
    data: {
      workspaceId: gimnasio.id,
      title: "Cardio 30 min",
      weight: 4,
      status: "TODO",
      position: 0,
    },
  });

  await db.task.create({
    data: {
      workspaceId: gimnasio.id,
      title: "Comprar proteína",
      weight: 3,
      status: "DONE",
      position: 0,
    },
  });

  // ---------- Nota independiente ----------
  await db.note.create({
    data: {
      userId: user.id,
      title: "Objetivos del trimestre",
      content:
        "# Objetivos Q3\n\n1. Lanzar el producto\n2. Hacer ejercicio 4x/semana\n3. Leer 3 libros\n\n*Revisar cada domingo.*",
      reminderAt: daysFromNow(7),
    },
  });

  console.log("✅ Seed completado.");
  console.log(`   Usuario demo: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
