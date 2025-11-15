import { parentPort, workerData } from 'node:worker_threads';
function countWordsWithProgress(text, callback) {
    const words = text.split(/\s+/).filter(Boolean);
    const uniqueWords = new Set();
    words.forEach((word, i) => {
        uniqueWords.add(word);
        if (i % 10 === 0)
            callback(Math.floor((i / words.length) * 100));
    });
    callback(100);
    return {
        totalWords: words.length,
        uniqueWords: uniqueWords.size
    };
}
const progressCallback = (p) => {
    parentPort?.postMessage({ progress: p });
};
const result = countWordsWithProgress(workerData.text, progressCallback);
parentPort?.postMessage({ id: workerData.id, result });
