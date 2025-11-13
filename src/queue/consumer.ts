import { getChannel } from "./connection";
import { processReport } from "../services/reportService";

export async function startConsumer() {
  const channel = getChannel();
  await channel.consume("reports", async (msg) => {
    if (!msg) return;
    const { reportId, text } = JSON.parse(msg.content.toString());
    console.log(`⚙️ Processing report ${reportId}`);
    try {
      const result = await processReport(text);
      console.log(`✅ Report ${reportId} done:`, result);
      channel.ack(msg);
    } catch (err) {
      console.error(`❌ Failed report ${reportId}:`, err);
      channel.nack(msg, false, false);
    }
  });
}
