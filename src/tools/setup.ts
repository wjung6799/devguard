import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { existsSync, readFileSync, writeFileSync, appendFileSync } from "fs";
import { join } from "path";

const INSTRUCTION = `After completing a task, switching branches, or making a significant commit, call the devdiary write_entry tool to log what was done and what's next.`;

const CONFIG_FILES = ["CLAUDE.md", ".cursorrules"] as const;
type ConfigFile = (typeof CONFIG_FILES)[number];

function hasInstruction(content: string): boolean {
  return content.includes("devdiary write_entry");
}

export function registerSetup(server: McpServer) {
  (server as any).tool(
    "setup",
    "Add devdiary's auto-logging instruction to your project's CLAUDE.md or .cursorrules. Run once per project — it appends the instruction so your AI writes diary entries automatically.",
    {
      project_path: z.string().describe("Absolute path to the project directory"),
      target: z
        .enum(["CLAUDE.md", ".cursorrules", "auto"])
        .default("auto")
        .describe(
          "Which config file to add the instruction to. 'auto' picks whichever already exists, preferring CLAUDE.md."
        ),
    },
    async ({ project_path, target }: { project_path: string; target: ConfigFile | "auto" }) => {
      let targetFile: ConfigFile;

      if (target === "auto") {
        // Prefer whichever already exists; default to CLAUDE.md
        if (existsSync(join(project_path, "CLAUDE.md"))) {
          targetFile = "CLAUDE.md";
        } else if (existsSync(join(project_path, ".cursorrules"))) {
          targetFile = ".cursorrules";
        } else {
          targetFile = "CLAUDE.md";
        }
      } else {
        targetFile = target;
      }

      const filePath = join(project_path, targetFile);

      // Check if already set up
      if (existsSync(filePath)) {
        const existing = readFileSync(filePath, "utf-8");
        if (hasInstruction(existing)) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Already set up — ${targetFile} already contains the devdiary instruction.`,
              },
            ],
          };
        }

        // Append to existing file
        const section = `\n\n# Dev Diary\n\n${INSTRUCTION}\n`;
        appendFileSync(filePath, section, "utf-8");
      } else {
        // Create new file
        const content = `# Dev Diary\n\n${INSTRUCTION}\n`;
        writeFileSync(filePath, content, "utf-8");
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Done — added devdiary instruction to ${targetFile}. Your AI will now log diary entries automatically.`,
          },
        ],
      };
    }
  );
}
