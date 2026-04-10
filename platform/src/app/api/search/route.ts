import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";

async function getUserId(request: Request): Promise<string | null> {
  const apiKey = await authenticateApiKey(request);
  if (apiKey) return apiKey.userId;

  const session = await getSession();
  if (session) return session.userId;

  return null;
}

export async function GET(request: Request) {
  const userId = await getUserId(request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const projectId = searchParams.get("projectId");

  if (!q) {
    return Response.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  // Get user's project IDs for scoping
  const projectWhere = projectId
    ? { id: projectId, userId }
    : { userId };
  const projects = await prisma.project.findMany({
    where: projectWhere,
    select: { id: true, name: true },
  });
  const projectIds = projects.map((p) => p.id);
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  if (projectIds.length === 0) {
    return Response.json({ entries: [], pages: [], notes: [], rules: [] });
  }

  const [entries, pages, notes, rules] = await Promise.all([
    prisma.diaryEntry.findMany({
      where: {
        projectId: { in: projectIds },
        OR: [
          { summary: { contains: q } },
          { content: { contains: q } },
        ],
      },
      orderBy: { date: "desc" },
      take: 20,
      select: { id: true, summary: true, branch: true, date: true, projectId: true },
    }),
    prisma.wikiPage.findMany({
      where: {
        projectId: { in: projectIds },
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
        ],
      },
      take: 20,
      select: { id: true, title: true, projectId: true, updatedAt: true },
    }),
    prisma.note.findMany({
      where: {
        projectId: { in: projectIds },
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
        ],
      },
      take: 20,
      select: { id: true, title: true, projectId: true, updatedAt: true },
    }),
    prisma.rule.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
        ],
      },
      take: 10,
      select: { id: true, title: true },
    }),
  ]);

  return Response.json({
    entries: entries.map((e) => ({ ...e, projectName: projectMap[e.projectId] })),
    pages: pages.map((p) => ({ ...p, projectName: projectMap[p.projectId] })),
    notes: notes.map((n) => ({ ...n, projectName: projectMap[n.projectId] })),
    rules,
  });
}
