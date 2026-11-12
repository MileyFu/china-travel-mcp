import { DATA_BUNDLE } from '../generated/dataBundle.js';
import type { CountryInfo, CountryVisaDossierSummary, PortInfo } from '../types.js';

export type VisitPurpose = 'tourism' | 'business' | 'visiting' | 'work' | 'study' | 'journalism';

export type CheckerStatus =
  | 'DIRECT_VISA_FREE'
  | 'ELIGIBLE_TWOV'
  | 'INELIGIBLE_SAME_COUNTRY'
  | 'INELIGIBLE_PURPOSE'
  | 'INELIGIBLE_DURATION'
  | 'VISA_REQUIRED_OTHER';

export interface VisaCheckInput {
  passport_country: string;
  origin_country?: string;
  entry_port?: string;
  onward_country?: string;
  planned_stay_hours?: number;
  purpose?: VisitPurpose;
}

const COUNTRY_ALIASES: Record<string, string> = {
  usa: 'US',
  'u.s.': 'US',
  'u.s.a.': 'US',
  america: 'US',
  'united states of america': 'US',
  uk: 'GB',
  britain: 'GB',
  'great britain': 'GB',
  england: 'GB',
  scotland: 'GB',
  wales: 'GB',
  korea: 'KR',
  'south korea': 'KR',
  rok: 'KR',
  uae: 'AE',
  holland: 'NL',
  czechia: 'CZ',
  bosnia: 'BA',
  brunei: 'BN',
  russia: 'RU',
  indonesia: 'ID',
  india: 'IN',
};

const PORT_CITY_FALLBACKS: Record<string, string> = {
  shanghai: 'PVG',
  pudong: 'PVG',
  hongqiao: 'SHA',
  beijing: 'PEK',
  capital: 'PEK',
  daxing: 'PKX',
  shenzhen: 'SZX',
  guangzhou: 'CAN',
  chengdu: 'TFU',
  chongqing: 'CKG',
  hangzhou: 'HGH',
  xian: 'XIY',
  "xi'an": 'XIY',
  kunming: 'KMG',
  xiamen: 'XMN',
  wuhan: 'WUH',
  qingdao: 'TAO',
  dalian: 'DLC',
  sanya: 'SYX',
  haikou: 'HAK',
  harbin: 'HRB',
  nanjing: 'NKG',
  tianjin: 'TSN',
};

export function resolveCountry(query: string): CountryInfo | undefined {
  const clean = query.trim();
  if (!clean) return undefined;
  const upper = clean.toUpperCase();
  const lower = clean.toLowerCase();

  const byCode = DATA_BUNDLE.countries.find((c) => c.code.toUpperCase() === upper);
  if (byCode) return byCode;

  const aliasCode = COUNTRY_ALIASES[lower];
  if (aliasCode) {
    const aliased = DATA_BUNDLE.countries.find((c) => c.code.toUpperCase() === aliasCode);
    if (aliased) return aliased;
  }

  const exactName = DATA_BUNDLE.countries.find((c) => c.name.toLowerCase() === lower);
  if (exactName) return exactName;

  return DATA_BUNDLE.countries.find((c) => c.name.toLowerCase().includes(lower));
}

export function resolvePort(portQuery?: string): PortInfo {
  const defaultPort = DATA_BUNDLE.ports.find((p) => p.code === 'PVG') ?? DATA_BUNDLE.ports[0];
  if (!portQuery || !portQuery.trim()) return defaultPort;

  const clean = portQuery.trim();
  const upper = clean.toUpperCase();
  const lower = clean.toLowerCase();

  const byCode = DATA_BUNDLE.ports.find((p) => p.code.toUpperCase() === upper);
  if (byCode) return byCode;

  const cityAlias = PORT_CITY_FALLBACKS[lower];
  if (cityAlias) {
    const matched = DATA_BUNDLE.ports.find((p) => p.code === cityAlias);
    if (matched) return matched;
  }

  const byCityOrName = DATA_BUNDLE.ports.find(
    (p) => p.city.toLowerCase() === lower || p.name.toLowerCase().includes(lower)
  );
  return byCityOrName ?? defaultPort;
}

export function findCountryDossier(countryCode: string): CountryVisaDossierSummary | undefined {
  return DATA_BUNDLE.countryDossiers.find((d) => d.code.toUpperCase() === countryCode.toUpperCase());
}

function normalizeCountryTerm(value: string): string {
  const lower = value.trim().toLowerCase();
  if (!lower) return '';
  if (COUNTRY_ALIASES[lower]) {
    const resolved = resolveCountry(COUNTRY_ALIASES[lower]);
    if (resolved) return resolved.name.toLowerCase();
  }
  const resolved = resolveCountry(lower);
  if (resolved) return resolved.name.toLowerCase();
  return lower;
}

export function evaluateChinaVisaAndTransit(input: VisaCheckInput) {
  const country = resolveCountry(input.passport_country);
  if (!country) {
    return {
      found: false as const,
      error: `Passport country "${input.passport_country}" was not recognized in the ChinaStay NIA registry.`,
      suggestions: DATA_BUNDLE.countries.slice(0, 15).map((c) => `${c.name} (${c.code})`),
      checkerUrl: 'https://chinastay.org/transit-visa-free-checker/',
    };
  }

  const port = resolvePort(input.entry_port);
  const dossier = findCountryDossier(country.code);
  const stayHours = input.planned_stay_hours ?? 240;
  const purpose: VisitPurpose = input.purpose ?? 'tourism';
  const origin = (input.origin_country ?? '').trim();
  const onward = (input.onward_country ?? '').trim();

  const deepLink = dossier
    ? `https://chinastay.org/visa-free/${dossier.slug}/`
    : 'https://chinastay.org/transit-visa-free-checker/';

  let status: CheckerStatus;
  let badgeText: string;
  let headline: string;
  let summary: string;
  let policyType: string;
  let maxHours = 0;
  let maxDays = 0;
  let permittedArea: string | undefined;
  let requiresConnectingTicket = false;
  let legalRequirements: string[];
  let refusalRisks: string[];
  let actionRecommendation: string;
  let alternativeChannelNote: string | undefined;

  if (country.category === 'none') {
    status = 'VISA_REQUIRED_OTHER';
    badgeText = 'CONSULAR VISA GENERALLY REQUIRED';
    headline = 'Consular Visa Generally Required for Regular Entry';
    summary = `Passports from ${country.name} are not currently covered under China's nationwide direct visa-free or 240-hour regional TWOV policies. For standard tourism or business travel, an L (Tourist) or M (Business) consular visa must generally be obtained prior to travel.`;
    policyType = 'Standard Consular Visa Regime';
    legalRequirements = [
      'Apply for an entry visa (L/M/Q) via the Chinese Visa Application Service Center (CVASC) or Chinese Embassy/Consulate',
      'Submit confirmed flight booking, hotel reservation, or an official invitation letter',
      'Hold an ordinary passport with at least 6 months remaining validity and blank visa pages',
    ];
    refusalRisks = [
      'Airlines will deny boarding without a valid Chinese visa or qualifying 24h direct airside transit.',
      'Standard visa-on-arrival is not available at border entry checkpoints.',
    ];
    actionRecommendation =
      'Check whether 24-hour direct airside transit or Hainan 30-day regional visa-free (for 59 nations) applies, or apply for an L/M visa via CVASC.';
  } else if (['work', 'study', 'journalism'].includes(purpose)) {
    status = 'INELIGIBLE_PURPOSE';
    badgeText = 'CONSULAR VISA STRICTLY REQUIRED';
    headline = 'Employment, Study, & Journalism Strictly Require Consular Visas';
    summary = `Neither direct visa exemption nor the 240-hour TWOV transit policy permits local employment, academic study, or journalistic reporting. Engaging in those activities without a Z, X, or J visa is a serious immigration violation.`;
    policyType = 'Consular Work/Study/Press Visa';
    legalRequirements = [
      'Apply for a Z (Working) Visa with official Foreigner Work Permit Notification',
      'Apply for an X (Student) Visa with Form JW202/JW201 & University Admission Notice',
      'Apply for a J (Journalist) Visa via the Chinese Embassy Press Section',
    ];
    refusalRisks = [
      'Attempting to enter on visa-free or TWOV status for employment results in immediate entry refusal, deportation, and multi-year entry bans.',
      'Employers face administrative fines up to ¥100,000 CNY for employing foreign nationals on visa-free/transit status.',
    ];
    actionRecommendation = 'Apply for the appropriate consular Z, X, or J visa prior to departure.';
  } else if (country.category === 'unilateral' || country.category === 'mutual') {
    const days = country.visaFreeDays ?? 30;
    const isUnilateral = country.category === 'unilateral';
    status = 'DIRECT_VISA_FREE';
    badgeText = `DIRECT VISA-FREE ENTRY (${days} DAYS)`;
    headline = `${country.name} Ordinary Passports Currently Eligible for Visa-Free Entry to China`;
    summary = `Holders of ordinary passports from ${country.name} are eligible for direct visa-free entry to China for up to ${days} days during the policy period. Direct round-trip flights are fully permitted—no transit route or third-country ticket is required.`;
    policyType = isUnilateral ? 'Unilateral Visa Exemption Trial' : 'Bilateral Visa Exemption Treaty';
    maxDays = days;
    maxHours = days * 24;
    permittedArea = 'Entire territory of Mainland China (excluding areas legally restricted to foreign nationals)';
    requiresConnectingTicket = false;
    alternativeChannelNote = country.twov240
      ? `As a citizen of ${country.name}, you also qualify for 240h TWOV, though direct ${days}-day visa-free entry is vastly superior (round-trip allowed, nationwide movement).`
      : undefined;
    legalRequirements = [
      'Permitted Purposes: Tourism, business, visiting friends/relatives, exchange visits, or transit',
      'Direct Round-Trip Allowed: No third-country ticket required; retain return flight and hotel booking proofs',
      'Entry Ports: Valid at any officially open air, sea, or land port in Mainland China',
      `Policy Window: ${country.policyValidity ?? 'Official policy'}`,
    ];
    refusalRisks = [
      'Local employment, long-term study, and journalism still strictly require Z, X, or J visas.',
      `Overstaying beyond ${days} days carries administrative fines of ¥500 CNY/day (up to ¥10,000 CNY) or detention.`,
    ];
    actionRecommendation =
      'Book your direct or multi-city trip freely, submit the NIA Digital Arrival Card before landing, and configure Alipay/WeChat Pay before departure.';
  } else {
    // 240h TWOV-only countries (e.g. United States, UK? Wait: check UK category in data, US, Canada, Brazil, Russia, etc.)
    const normOrigin = normalizeCountryTerm(origin);
    const normDest = normalizeCountryTerm(onward);
    requiresConnectingTicket = true;

    if (!normOrigin || !normDest) {
      status = 'INELIGIBLE_SAME_COUNTRY';
      badgeText = 'ITINERARY DETAILS REQUIRED FOR 240H TWOV';
      headline = `${country.name} Requires a Confirmed Third Destination (Country A -> China -> Country C) for TWOV`;
      summary = `${country.name} passport holders do NOT have direct 30-day visa-free entry. To enter China visa-free under the 240-Hour (10-Day) TWOV scheme, you must provide both your origin country/region (Country A) and a DIFFERENT confirmed onward third country/region (Country C, including Hong Kong, Macau, or Taiwan).`;
      policyType = '240h TWOV Onward Ticket Requirement';
      legalRequirements = [
        'Confirmed connecting flight/vessel/train ticket to a THIRD country or territory (Country C != Country A) within 240 hours of 00:00 the day after arrival',
        'Hong Kong (HKG), Macau (MFM), and Taiwan (TPE) count as eligible third destinations for TWOV purposes',
        `Ordinary ${country.name} passport with >= 3 months remaining validity`,
      ];
      refusalRisks = [
        'Without both origin_country and onward_country confirmed to different territories, airlines will deny boarding.',
      ];
      actionRecommendation =
        'Re-run this check with both origin_country and onward_country (for example origin_country="United States" and onward_country="Hong Kong" or "Japan").';
    } else if (normOrigin === normDest || normOrigin.includes(normDest) || normDest.includes(normOrigin)) {
      status = 'INELIGIBLE_SAME_COUNTRY';
      badgeText = 'NOT A VALID TRANSIT ROUTE (ROUND-TRIP REJECTED)';
      headline = 'Round-Trip Tickets Are NOT Eligible for 240-Hour Transit Without Visa';
      summary = `Your itinerary (${origin} -> China -> ${onward}) returns to the same country/region of origin. Under NIA law, 240h TWOV requires an unbroken transit from Country A to a DIFFERENT third country/region Country C. Airlines will deny boarding without a consular visa.`;
      policyType = '240h TWOV Rejection Scenario';
      legalRequirements = [
        'Depart Mainland China to a THIRD sovereign country or overseas territory (Country C != Country A)',
        'Hong Kong (HKG), Macau (MFM), and Taiwan (TPE) qualify as eligible third destinations',
        'Confirmed seat, date, and flight/vessel number departing within 240 hours',
      ];
      refusalRisks = [
        `Booking ${origin} -> China -> ${onward} without a Chinese visa results in immediate boarding denial at check-in.`,
        'Domestic China layovers before exiting internationally still count as one transit leg, but Country A and Country C must differ.',
      ];
      actionRecommendation =
        'Add an affordable stopover in Hong Kong, Seoul, Tokyo, or Singapore (e.g. Origin -> Shanghai -> Hong Kong) so Country A != Country C, OR apply for an L/M consular visa.';
    } else if (stayHours > 240) {
      status = 'INELIGIBLE_DURATION';
      badgeText = 'EXCEEDS 240-HOUR LIMIT';
      headline = `Planned Stay (${stayHours} Hours) Exceeds the Legal 240-Hour Limit`;
      summary = `The 240-hour TWOV scheme permits a maximum stay of 240 hours (10 days, counted from 00:00 the day after entry). A confirmed onward departure at ${stayHours} hours violates the transit cap.`;
      policyType = '240-Hour TWOV Policy';
      maxHours = 240;
      maxDays = 10;
      permittedArea = port.permittedArea;
      legalRequirements = [
        'Onward international departure must be within 240 hours of 00:00 the day following arrival',
        'Confirmed seat booking required (standby/open tickets rejected)',
      ];
      refusalRisks = [
        'Overstaying TWOV results in detention, ¥500 CNY/day fines, and future entry bans.',
      ];
      actionRecommendation = 'Shorten your Mainland China stay to <= 240 hours or apply for an L/M visa.';
    } else {
      status = 'ELIGIBLE_TWOV';
      badgeText = 'ELIGIBLE: 240-HOUR TRANSIT WITHOUT VISA (TWOV)';
      headline = `Verified Eligible for China's 240-Hour (10-Day) Transit Visa Exemption`;
      summary = `As an ordinary passport holder from ${country.name} traveling ${origin} -> ${port.city} (${port.code}) -> ${onward} for ${stayHours} hours, you qualify for China's 240-Hour (10-Day) TWOV scheme across designated areas of 24 provinces/municipalities without an advance embassy visa.`;
      policyType = 'China 240-Hour TWOV Protocol (57-Nation Group)';
      maxHours = 240;
      maxDays = 10;
      permittedArea = port.permittedArea;
      legalRequirements = [
        `Valid ${country.name} ordinary passport (>= 3 months remaining validity)`,
        `Confirmed seat ticket departing Mainland China to ${onward} within 240 hours of 00:00 the day after arrival`,
        `Cross-province movement is permitted across designated zones of 24 provinces/municipalities, exiting via any of the 65 open ports`,
        'Pre-file Foreigner Digital Arrival Card (NIA online platform / Alipay / WeChat) and ensure hotel registers your passport with local PSB within 24h',
      ];
      refusalRisks = [
        'Country A must strictly differ from Country C (Hong Kong/Macau/Taiwan qualify as Country C).',
        'Certain provinces (e.g., Sichuan, Yunnan, Guangxi) limit movement to designated cities/prefectures rather than the entire province.',
        'Standby or open-dated onward tickets are rejected.',
      ];
      actionRecommendation =
        'Confirm your onward ticket shows your exact name and passport number, and carry a printout showing Country A -> China -> Country C for airline check-in agents.';
    }
  }

  return {
    found: true as const,
    country: {
      code: country.code,
      name: country.name,
      category: country.category,
      twov240: country.twov240,
      policyValidity: country.policyValidity ?? null,
    },
    entryPort: {
      code: port.code,
      name: port.name,
      city: port.city,
      province: port.province,
      type: port.type,
      permittedArea: port.permittedArea,
    },
    verdict: {
      status,
      badgeText,
      headline,
      summary,
      policyType,
      maxDays,
      maxHours,
      requiresConnectingTicket,
      permittedArea: permittedArea ?? null,
      alternativeChannelNote: alternativeChannelNote ?? null,
      legalRequirements,
      refusalRisks,
      actionRecommendation,
    },
    dossierContext: dossier
      ? {
          allowedStayArea: dossier.allowedStayArea,
          specialPassportWarning: dossier.specialPassportWarning,
          sampleRoutes: dossier.sampleRoutes,
          eSIMAdvice: dossier.eSIMAdvice,
        }
      : null,
    officialDeepLinks: {
      countryGuide: deepLink,
      interactiveChecker: 'https://chinastay.org/transit-visa-free-checker/',
    },
    dataSnapshotDate: DATA_BUNDLE.generatedAt,
  };
}
