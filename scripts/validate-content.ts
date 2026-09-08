import { getCatalogue } from "@/content";

const c = getCatalogue();
console.log(`Content ${c.contentVersion}: ${c.capabilities.length} capabilities, ${c.lessons.length} lessons, ${c.items.length} item families, ${c.rubrics.length} rubrics, ${c.practices.length} practice templates.`);
console.log(`Available capabilities: ${Array.from(c.availableCapabilities).sort().join(", ")}`);
for (const m of c.effectiveMilestones) console.log(`  ${m.id} ${m.status.padEnd(9)} ${m.title}`);
for (const i of c.issues) console.log(`  [${i.severity}] ${i.ref}: ${i.message}`);
