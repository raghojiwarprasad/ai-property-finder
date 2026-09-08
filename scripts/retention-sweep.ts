import { retentionSweep } from "@/server/services/privacy";
import { resetDbForTests } from "@/server/db";

retentionSweep().then(async (r) => {
  console.log(JSON.stringify(r));
  await resetDbForTests();
}).catch(async (e) => { console.error(e); await resetDbForTests(); process.exit(1); });
