export function buildNodeShellCommand(command: string, platform?: string | null) {
  const normalized = String(platform ?? "")
    .trim()
    .toLowerCase();
  if (normalized.startsWith("win")) {
    // SECURITY: escape bare & to prevent command chaining injection via cmd.exe
    const sanitized = command.replace(/(?<![&|^])&(?![&|])/g, "^&");
    return ["cmd.exe", "/d", "/s", "/c", sanitized];
  }
  return ["/bin/sh", "-lc", command];
}
