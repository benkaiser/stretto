export default class Country {
  static current() {
    return localStorage.getItem('country') || 'us';
  }

  // this list represents an intersection of supported countries by both iTunes and Spotify
  static countries() {
    return {
      'ar': 'Argentina',
      'au': 'Australia',
      'at': 'Austria',
      'be': 'Belgium',
      'bo': 'Bolivia',
      'br': 'Brazil',
      'bg': 'Bulgaria',
      'ca': 'Canada',
      'cl': 'Chile',
      'co': 'Colombia',
      'cr': 'Costa Rica',
      'cy': 'Cyprus',
      'cz': 'Czech Republic',
      'dk': 'Denmark',
      'do': 'Dominican Republic',
      'ec': 'Ecuador',
      'sv': 'El Salvador',
      'ee': 'Estonia',
      'fi': 'Finland',
      'fr': 'France',
      'de': 'Germany',
      'gb': 'United Kingdom',
      'gr': 'Greece',
      'gt': 'Guatemala',
      'hn': 'Honduras',
      'hk': 'Hong Kong',
      'hu': 'Hungary',
      'is': 'Iceland',
      'id': 'Indonesia',
      'ie': 'Ireland',
      'il': 'Israel',
      'it': 'Italy',
      'jp': 'Japan',
      'lv': 'Latvia',
      'lt': 'Lithuania',
      'lu': 'Luxembourg',
      'my': 'Malaysia',
      'mt': 'Malta',
      'mx': 'Mexico',
      'nl': 'Netherlands',
      'nz': 'New Zealand',
      'ni': 'Nicaragua',
      'no': 'Norway',
      'pa': 'Panama',
      'py': 'Paraguay',
      'pe': 'Peru',
      'ph': 'Philippines',
      'pl': 'Poland',
      'pt': 'Portugal',
      'ro': 'Romania',
      'sg': 'Singapore',
      'sk': 'Slovakia',
      'za': 'South Africa',
      'es': 'Spain',
      'se': 'Sweden',
      'ch': 'Switzerland',
      'tw': 'Taiwan',
      'th': 'Thailand',
      'tr': 'Turkey',
      'us': 'United States',
      'uy': 'Uruguay',
      'vn': 'Viet Nam'
    };
  }

  static setCountry(country) {
    localStorage.setItem('country', country);
  }
}