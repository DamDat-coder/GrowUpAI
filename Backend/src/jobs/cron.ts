import cron from "node-cron";
import { autoPublishNews } from "./autoPublishNews.job";

const schedule = "* * * * *";
cron.schedule(schedule, async () => {
  await autoPublishNews();
});

