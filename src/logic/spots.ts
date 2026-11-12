import { DATA_BUNDLE } from '../generated/dataBundle.js';
import type { ViralSpot } from '../types.js';

export interface ViralSpotInput {
  query?: string;
  city?: string;
}

function formatSpot(spot: ViralSpot) {
  return {
    id: spot.id,
    spotNumber: spot.spotNumber,
    title: spot.title,
    chineseTitle: spot.chineseTitle,
    city: spot.city,
    category: spot.category,
    creatorContext: {
      creatorEntity: spot.creatorEntity,
      viewsContext: spot.viewsContext,
    },
    summary: spot.summary,
    exactSpot: spot.exactSpot,
    coordinates: {
      lat: spot.coordinates.lat,
      lng: spot.coordinates.lng,
      appleMapsUrl: spot.coordinates.appleMapsUrl,
      gpsWarning:
        'Use Apple Maps or Amap (Gaode) inside China; Google Maps has a ~500m GCJ-02 coordinate offset.',
    },
    chineseTaxiDriverCard: {
      didiDestinationChinese: spot.taxiDirections.didiChinese,
      pinyin: spot.taxiDirections.pinyin,
      showDriverSentence: spot.taxiDirections.driverInstructions,
      driverSubnote: spot.taxiDirections.driverSubnote,
      avoidMistakeWarning: spot.taxiDirections.avoidMistakeWarning,
    },
    foreignerHurdle: spot.foreignerHurdle,
    nearbyStay: spot.nearbyStay,
    fieldNotes: spot.fieldNotes,
    deepLinks: {
      spotAnchorUrl: `https://chinastay.org/viral-coordinates/#${spot.id}`,
      allSpotsUrl: 'https://chinastay.org/viral-coordinates/',
      cityGuideUrl: spot.citySlug ? `https://chinastay.org/city-guides/${spot.citySlug}/` : null,
    },
  };
}

export function lookupViralSpotDriverCards(input: ViralSpotInput) {
  let pool = DATA_BUNDLE.viralSpots;
  const cityFilter = (input.city ?? '').trim().toLowerCase();
  const q = (input.query ?? '').trim().toLowerCase();

  if (cityFilter) {
    pool = pool.filter((s) => s.city.toLowerCase().includes(cityFilter));
  }

  if (q) {
    pool = pool.filter((s) => {
      const haystack = [
        s.id,
        s.spotNumber,
        s.title,
        s.chineseTitle,
        s.city,
        s.category,
        s.creatorEntity,
        s.exactSpot,
        s.summary,
        s.taxiDirections.didiChinese,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  if (pool.length === 0) {
    return {
      found: false as const,
      error: `No viral spot matched query="${input.query ?? ''}" city="${input.city ?? ''}".`,
      availableSpots: DATA_BUNDLE.viralSpots.map((s) => ({
        id: s.id,
        spotNumber: s.spotNumber,
        city: s.city,
        title: s.title,
        deepLink: `https://chinastay.org/viral-coordinates/#${s.id}`,
      })),
      hubUrl: 'https://chinastay.org/viral-coordinates/',
    };
  }

  return {
    found: true as const,
    totalMatched: pool.length,
    spots: pool.map(formatSpot),
    hubUrl: 'https://chinastay.org/viral-coordinates/',
    dataSnapshotDate: DATA_BUNDLE.generatedAt,
  };
}
