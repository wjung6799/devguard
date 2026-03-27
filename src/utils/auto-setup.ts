import { existsSync, readFileSync, writeFileSync, appendFileSync } from "fs";
import { join } from "path";

const GITIGNORE_ENTRY = ".devdiary/";
const INSTRUCTION = `After completing a task, switching branches, or making a significant commit, call the devdiary write_entry tool to log what was done and what's next.`;

export function autoSetup(projectPath: string): void {
  addToGitignore(projectPath);
  addInstruction(projectPath);
}

/** Returns true if `.devdiary/` was added to `.gitignore`. */
export function addToGitignore(projectPath: string): boolean {
  const gitignorePath = join(projectPath, ".gitignore");

  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, "utf-8");
    if (content.includes(GITIGNORE_ENTRY)) return false;
    appendFileSync(gitignorePath, `\n${GITIGNORE_ENTRY}\n`, "utf-8");
  } else {
    writeFileSync(gitignorePath, `${GITIGNORE_ENTRY}\n`, "utf-8");
  }

  console.error(`devdiary: added ${GITIGNORE_ENTRY} to .gitignore`);
  return true;
}

function addInstruction(projectPath: string): void {
  const claudeMd = join(projectPath, "CLAUDE.md");
  const cursorrules = join(projectPath, ".cursorrules");

  // Pick target: prefer whichever exists, default to CLAUDE.md
  let targetPath: string;
  let targetName: string;

  if (existsSync(claudeMd)) {
    targetPath = claudeMd;
    targetName = "CLAUDE.md";
  } else if (existsSync(cursorrules)) {
    targetPath = cursorrules;
    targetName = ".cursorrules";
  } else {
    targetPath = claudeMd;
    targetName = "CLAUDE.md";
  }

  // Already has it?
  if (existsSync(targetPath)) {
    const content = readFileSync(targetPath, "utf-8");
    if (content.includes("devdiary write_entry")) return;
    appendFileSync(targetPath, `\n\n# Dev Diary\n\n${INSTRUCTION}\n`, "utf-8");
  } else {
    writeFileSync(targetPath, `# Dev Diary\n\n${INSTRUCTION}\n`, "utf-8");
  }

  console.error(`devdiary: added auto-logging instruction to ${targetName}`);
}
