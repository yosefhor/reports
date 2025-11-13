export type ReportStatus = 'queued' | 'processing' | 'completed' | 'failed';


export interface ReportResult {
totalWords?: number;
uniqueWords?: number;
error?: string;
}