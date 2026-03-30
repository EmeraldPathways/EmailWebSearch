export interface ContactExtraction {
  url: string;
  emails: string[];
  socialLinks: Record<string, string[]>;
  phoneNumbers: string[];
  scannedPages: string[];
  status: 'success' | 'error';
  error: string | null;
  extractedAt: string;
}

export interface ExtractionJob {
  id: string;
  urls: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: ContactExtraction[];
  createdAt: string;
  completedAt?: string;
}
