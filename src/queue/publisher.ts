import { getChannel } from "./connection";

export async function publishReport(reportId: string, text: string) {
  const channel = getChannel();
  const message = JSON.stringify({ reportId, text });
  channel.sendToQueue("reports", Buffer.from(message), { persistent: true });
  console.log(`📨 Report ${reportId} queued`);
}
