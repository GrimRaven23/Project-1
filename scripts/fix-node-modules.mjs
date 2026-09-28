import fs from "fs";
import path from "path";

const nmPath = path.resolve("node_modules");
if (fs.existsSync(nmPath)) {
  const entries = fs.readdirSync(nmPath);
  for (const entry of entries) {
    if (entry.startsWith(".") && entry !== ".bin" && entry !== ".package-lock.json") {
      // e.g. .next-dtiPPFDZ -> next
      const cleanName = entry.substring(1).split("-")[0];
      const oldPath = path.join(nmPath, entry);
      const targetPath = path.join(nmPath, cleanName);

      try {
        if (fs.existsSync(targetPath)) {
          fs.rmSync(targetPath, { recursive: true, force: true });
        }
        fs.renameSync(oldPath, targetPath);
        console.log(`Renamed staged ${entry} -> ${cleanName}`);
      } catch (err) {
        console.error(`Error renaming ${entry}:`, err.message);
      }
    }
  }
}
console.log("Node modules staging cleanup complete.");
