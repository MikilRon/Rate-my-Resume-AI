export type Analysis = {
  overall: number;
  ats: number;
  skillMatch: number;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  improvedBullets: { before: string; after: string }[];
};