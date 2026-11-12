import { DATA_BUNDLE } from '../generated/dataBundle.js';
import type { AppItem } from '../types.js';

export interface AppCheckInput {
  query?: string;
  category?: 'essentials' | 'social' | 'ai_work' | 'payments' | 'entertainment' | 'travel' | 'dating' | 'all';
}

const QUERY_SYNONYMS: Record<string, string[]> = {
  uber: ['didi', 'apple-maps'],
  lyft: ['didi'],
  wa: ['whatsapp'],
  ig: ['instagram'],
  insta: ['instagram'],
  fb: ['facebook'],
  yt: ['youtube'],
  gpt: ['chatgpt', 'openai'],
  openai: ['chatgpt'],
  ai: ['chatgpt', 'claude', 'gemini', 'perplexity'],
  maps: ['google-maps', 'apple-maps', 'amap'],
  pay: ['alipay', 'wechat-pay', 'wise', 'revolut'],
  taxi: ['didi'],
  train: ['trip-com', '12306'],
};

function scoreAppMatch(app: AppItem, qLower: string, synonymTargets: string[]): number {
  const idLower = app.id.toLowerCase();
  const nameLower = app.name.toLowerCase();

  if (idLower === qLower || nameLower === qLower) return 100;
  if (synonymTargets.includes(idLower)) return 90;
  if (nameLower.startsWith(qLower) || idLower.startsWith(qLower)) return 80;
  if (nameLower.includes(qLower) || idLower.includes(qLower)) return 70;
  if (app.tags.some((t) => t.toLowerCase() === qLower)) return 65;
  if (app.tags.some((t) => t.toLowerCase().includes(qLower))) return 50;
  if (
    app.bottomLine.toLowerCase().includes(qLower) ||
    (app.localAlternative?.name.toLowerCase().includes(qLower) ?? false)
  ) {
    return 35;
  }
  return 0;
}

export function checkChinaAppCompatibility(input: AppCheckInput) {
  const category = input.category && input.category !== 'all' ? input.category : undefined;
  const rawQuery = (input.query ?? '').trim();

  let pool = DATA_BUNDLE.apps;
  if (category) {
    pool = pool.filter((a) => a.category === category);
  }

  if (!rawQuery) {
    return {
      found: true as const,
      totalMatched: pool.length,
      mode: 'category_directory' as const,
      categoryFilter: category ?? 'all',
      apps: pool.map((a) => ({
        id: a.id,
        name: a.name,
        category: a.category,
        wifiStatus: a.wifiStatus,
        wifiLabel: a.wifiLabel,
        esimStatus: a.esimStatus,
        esimLabel: a.esimLabel,
        bottomLine: a.bottomLine,
        localAlternative: a.localAlternative?.name ?? null,
        deepLink: `https://chinastay.org/app-checker/${a.id}/`,
      })),
      directoryUrl: 'https://chinastay.org/app-checker/',
      dataSnapshotDate: DATA_BUNDLE.generatedAt,
    };
  }

  const qLower = rawQuery.toLowerCase();
  const synonymTargets = QUERY_SYNONYMS[qLower] ?? [];

  const ranked = pool
    .map((app) => ({ app, score: scoreAppMatch(app, qLower, synonymTargets) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  if (ranked.length === 0) {
    return {
      found: false as const,
      error: `No tested app matched "${rawQuery}" in the ChinaStay ${DATA_BUNDLE.apps.length}-app compatibility matrix.`,
      availableCategories: DATA_BUNDLE.appCategories.map((c) => c.id),
      sampleApps: DATA_BUNDLE.apps.slice(0, 12).map((a) => ({
        id: a.id,
        name: a.name,
        deepLink: `https://chinastay.org/app-checker/${a.id}/`,
      })),
      directoryUrl: 'https://chinastay.org/app-checker/',
    };
  }

  const note =
    qLower === 'uber'
      ? 'Uber exited Mainland China (merged with DiDi). Use DiDi via Alipay Mini-Program or the standalone DiDi Rider English app.'
      : undefined;

  return {
    found: true as const,
    totalMatched: ranked.length,
    mode: 'search_results' as const,
    query: rawQuery,
    note: note ?? null,
    results: ranked.map(({ app }) => ({
      id: app.id,
      name: app.name,
      category: app.category,
      categoryLabel: app.categoryLabel,
      badgeText: app.badgeText ?? null,
      wifi: {
        status: app.wifiStatus,
        label: app.wifiLabel,
      },
      roamingEsim: {
        status: app.esimStatus,
        label: app.esimLabel,
      },
      bottomLine: app.bottomLine,
      theCatch: app.theCatch,
      workaround: app.workaround,
      localAlternative: app.localAlternative
        ? {
            name: app.localAlternative.name,
            notes: app.localAlternative.notes,
            guideLink: app.localAlternative.guideLink
              ? `https://chinastay.org${app.localAlternative.guideLink}`
              : null,
          }
        : null,
      deepLink: `https://chinastay.org/app-checker/${app.id}/`,
    })),
    directoryUrl: 'https://chinastay.org/app-checker/',
    dataSnapshotDate: DATA_BUNDLE.generatedAt,
  };
}
