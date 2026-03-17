import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as git from "../utils/git.js";
import * as storage from "../utils/storage.js";

export function registerCatchMeUp(server: McpServer) {
  (server as any).tool(
    "catch_me_up",
    "The morning briefing. Reads your recent diary entries and current git state, then returns everything the AI needs to give you a conversational catch-up — like a teammate who was watching over your shoulder.",
    {
      project_path: z.string().describe("Absolute path to the project directory"),
    },
    async ({ project_path }: { project_path: string }) => {
      const parts: string[] = [];

      // Recent diary entries
      const entries = storage.readEntries(project_path, 3);
      if (entries.length > 0) {
        parts.push("## Recent Diary Entries\n");
        entries.forEach((entry, i) => {
          parts.push(`### ${i === 0 ? "Latest" : `Entry ${i + 1}`}\n${entry}`);
        });
      } else {
        parts.push("## No previous diary entries found.\n");
      }

      // Current git state
      if (git.isGitRepo(project_path)) {
        const branch = git.getBranch(project_path);
        const status = git.getStatus(project_path);
        const commits = git.getRecentCommits(project_path, 5);
        const diff = git.getDiffFull(project_path);

        parts.push(
          `## Current Git State`,
          `**Branch:** ${branch}`,
          `**Working tree:**\n${status || "Clean"}`,
          `**Recent commits:**\n${commits || "None"}`,
          `**Uncommitted changes:**\n${diff}`,
        );
      }

      parts.push(
        "",
        "---",
        "Use all of the above to give the user a conversational catch-up briefing. Be specific — mention file names, branch names, what was last worked on, and where they should probably start today. Talk like a teammate, not a changelog.",
      );

      return {
        content: [{ type: "text" as const, text: parts.join("\n\n") }],
      };
    }
  );
}
