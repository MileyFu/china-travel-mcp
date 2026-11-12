import { DATA_BUNDLE } from '../generated/dataBundle.js';
import type { CityTranslatorDossier } from '../types.js';

export interface CityFixerInput {
  city?: string;
  include_faqs?: boolean;
}

const CITY_ALIASES: Record<string, string> = {
  "xi'an": 'xian',
  'xi an': 'xian',
  canton: 'guangzhou',
  sz: 'shenzhen',
  sh: 'shanghai',
  bj: 'beijing',
  cd: 'chengdu',
  lushang: 'jiujiang',
  lushan: 'jiujiang',
};

function resolveCityDossier(cityInput: string): CityTranslatorDossier | undefined {
  const clean = cityInput.trim().toLowerCase();
  if (!clean) return undefined;
  const alias = CITY_ALIASES[clean] ?? clean;

  return DATA_BUNDLE.cityFixers.find(
    (d) =>
      d.slug.toLowerCase() === alias ||
      d.name.toLowerCase() === alias ||
      d.name.toLowerCase().includes(clean) ||
      d.chineseName === cityInput.trim()
  );
}

export function lookupCityFixerRates(input: CityFixerInput) {
  const includeFaqs = input.include_faqs ?? true;
  const rawCity = (input.city ?? '').trim();

  if (!rawCity) {
    return {
      found: true as const,
      mode: 'all_cities' as const,
      serviceGuarantees: {
        commissionPolicy: '0% kickbacks / zero hidden shopping commissions',
        languageStandard: 'C2 bilingual licensed cultural interpreters & technical/medical fixers',
        quoteTurnaroundSLA: 'Within 12 hours of inquiry submission',
        preFlightRouteAudit: '$69 USD (45-min 1-on-1 route, app & payment verification call)',
      },
      coveredCities: DATA_BUNDLE.cityFixers.map((d) => ({
        slug: d.slug,
        name: d.name,
        chineseName: d.chineseName,
        regionTag: d.regionTag,
        tagline: d.tagline,
        rateTiers: d.rates.map((r) => ({
          tier: r.tier,
          duration: r.duration,
          pricingTag: r.pricingTag,
          rateNote: r.rateNote,
        })),
        fixerPageUrl: `https://chinastay.org/city-guides/${d.slug}/local-translator/`,
        cityGuideUrl: `https://chinastay.org${d.relatedGuideUrl}/`,
      })),
      customPlanningUrl: 'https://chinastay.org/plan-your-tour/',
      dataSnapshotDate: DATA_BUNDLE.generatedAt,
    };
  }

  const dossier = resolveCityDossier(rawCity);
  if (!dossier) {
    return {
      found: false as const,
      error: `City "${rawCity}" does not currently have a dedicated ChinaStay local fixer dossier.`,
      supportedCities: DATA_BUNDLE.cityFixers.map((d) => ({
        slug: d.slug,
        name: d.name,
        chineseName: d.chineseName,
        fixerPageUrl: `https://chinastay.org/city-guides/${d.slug}/local-translator/`,
      })),
      customPlanningUrl: 'https://chinastay.org/plan-your-tour/',
    };
  }

  return {
    found: true as const,
    mode: 'city_dossier' as const,
    city: {
      slug: dossier.slug,
      name: dossier.name,
      chineseName: dossier.chineseName,
      province: dossier.province,
      regionTag: dossier.regionTag,
    },
    tagline: dossier.tagline,
    leadFixerNote: dossier.leadFixerNote,
    overview: dossier.overview,
    serviceStandards: {
      commissionPolicy: '0% kickbacks / unbiased local advocacy',
      quoteTurnaroundSLA: 'Transparent custom quote emailed within 12 hours',
      preFlightRouteAuditOption: '$69 USD for a 45-min 1-on-1 Pre-Flight Route & App Audit',
      pricingModelNote:
        'ChinaStay publishes progressive tier structure (Single-Day Base Rate Tier -> 2–3 Day Volume Discount Tier -> Extended Maximum Bundle Savings) and provides exact custom quotes within 12 hours based on language specialization, group size, and private vehicle needs.',
    },
    rateTiers: dossier.rates,
    scenariosHandled: dossier.scenarios,
    insiderTips: dossier.insiderTips,
    ...(includeFaqs ? { faqs: dossier.faqs } : {}),
    deepLinks: {
      fixerBookingPage: `https://chinastay.org/city-guides/${dossier.slug}/local-translator/`,
      cityTravelGuide: `https://chinastay.org${dossier.relatedGuideUrl}/`,
      customTourInquiry: 'https://chinastay.org/plan-your-tour/',
    },
    dataSnapshotDate: DATA_BUNDLE.generatedAt,
  };
}
