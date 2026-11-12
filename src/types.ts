export type ExemptionCategory = 'unilateral' | 'mutual' | 'twov_only' | 'none';

export interface CountryInfo {
  code: string;
  name: string;
  region: 'Europe' | 'Americas' | 'Oceania' | 'Asia' | 'Africa' | 'Other';
  category: ExemptionCategory;
  twov240: boolean;
  twov57?: boolean;
  twov55?: boolean;
  unilateralVisaFree?: boolean;
  visaFreeDays?: number;
  policyValidity?: string;
  notes?: string;
}

export interface PortInfo {
  code: string;
  name: string;
  city: string;
  province: string;
  regionName: string;
  type: 'Airport' | 'Seaport' | 'Railway' | 'Land';
  hours: 240;
  permittedArea: string;
}

export interface RouteExample {
  route: string;
  description: string;
  status: 'valid' | 'invalid';
  rejectionReason?: string;
}

export interface SpecialPassportWarning {
  badge: string;
  title: string;
  description: string;
  affectedPassportType: string;
  officialRule: string;
}

export interface CountryVisaDossierSummary {
  slug: string;
  code: string;
  name: string;
  demonym: string;
  flag: string;
  region: string;
  category: string;
  policyTitle: string;
  maxStayDays: number;
  maxStayHours: number;
  directRoundTripAllowed: boolean;
  thirdCountryRequired: boolean;
  policyValidity: string;
  executiveSummary: string;
  allowedStayArea: string;
  sampleRoutes: RouteExample[];
  eSIMAdvice: string;
  specialPassportWarning: SpecialPassportWarning | null;
}

export interface AppItem {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  appVsWeb?: boolean;
  badgeText?: string;
  wifiStatus: 'blocked' | 'degraded' | 'native' | string;
  wifiLabel: string;
  esimStatus: 'blocked' | 'degraded' | 'native' | string;
  esimLabel: string;
  bottomLine: string;
  theCatch: string;
  workaround: string;
  localAlternative?: {
    name: string;
    notes: string;
    guideLink?: string;
    isGuideOnly?: boolean;
  };
  shareHook?: string;
  tags: string[];
  featured?: boolean;
}

export interface AppCategory {
  id: string;
  label: string;
  description?: string;
}

export interface ViralSpot {
  id: string;
  spotNumber: string;
  title: string;
  chineseTitle: string;
  city: string;
  citySlug?: string;
  category: string;
  creatorEntity: string;
  viewsContext: string;
  summary: string;
  exactSpot: string;
  coordinates: {
    lat: number;
    lng: number;
    appleMapsUrl: string;
  };
  taxiDirections: {
    didiChinese: string;
    pinyin: string;
    driverInstructions: string;
    driverSubnote: string;
    avoidMistakeWarning: string;
  };
  foreignerHurdle: {
    problem: string;
    workaround: string[];
  };
  nearbyStay: {
    name: string;
    distance: string;
    note: string;
  };
  fieldNotes: string;
}

export interface CityTranslatorDossier {
  slug: string;
  name: string;
  chineseName: string;
  province: string;
  regionTag: string;
  tagline: string;
  seoTitle: string;
  seoDescription: string;
  relatedGuideUrl: string;
  leadFixerNote: string;
  overview: string;
  scenarios: {
    title: string;
    subtitle: string;
    description: string;
    tags: string[];
  }[];
  rates: {
    tier: string;
    duration: string;
    pricingTag: string;
    rateNote: string;
    bestFor: string;
  }[];
  insiderTips: { title: string; detail: string }[];
  faqs: { question: string; answer: string }[];
}

export interface DataBundle {
  generatedAt: string;
  countries: CountryInfo[];
  ports: PortInfo[];
  countryDossiers: CountryVisaDossierSummary[];
  apps: AppItem[];
  appCategories: AppCategory[];
  viralSpots: ViralSpot[];
  cityFixers: CityTranslatorDossier[];
}
