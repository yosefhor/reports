export async function processReport(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  const total = words.length;
  const unique = new Set(words.map(w => w.toLowerCase())).size;
  await new Promise(res => setTimeout(res, 2000)); // הדמיית עיבוד איטי
  return { total, unique };
}
