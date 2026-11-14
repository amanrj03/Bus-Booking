export const INDIAN_CITIES_CATALOG = [
  { name: 'Delhi', state: 'Delhi NCR', hub: 'ISBT Kashmere Gate / Anand Vihar' },
  { name: 'Jaipur', state: 'Rajasthan', hub: 'Sindhi Camp / 200 Ft Bypass' },
  { name: 'Mumbai', state: 'Maharashtra', hub: 'Borivali East / Dadar TT / Vashi' },
  { name: 'Pune', state: 'Maharashtra', hub: 'Wakad Bridge / Swargate / Station' },
  { name: 'Bangalore', state: 'Karnataka', hub: 'Majestic KBS / Silk Board / Electronic City' },
  { name: 'Chennai', state: 'Tamil Nadu', hub: 'Koyambedu CMBT / Guindy Kathipara' },
  { name: 'Hyderabad', state: 'Telangana', hub: 'MGBS Bus Stand / Ameerpet / Gachibowli' },
  { name: 'Ahmedabad', state: 'Gujarat', hub: 'Paldi Cross Roads / Geeta Mandir / CTM' },
  { name: 'Chandigarh', state: 'Punjab / Haryana', hub: 'Sector 43 ISBT / Tribune Chowk' },
  { name: 'Udaipur', state: 'Rajasthan', hub: 'Udiapole Bus Stand / Reti Stand' },
  { name: 'Agra', state: 'Uttar Pradesh', hub: 'ISBT Agra / Idgah / Water Works' },
  { name: 'Lucknow', state: 'Uttar Pradesh', hub: 'Alambagh ISBT / Charbagh' },
  { name: 'Jodhpur', state: 'Rajasthan', hub: 'Paota Bus Stand / Railway Station' },
  { name: 'Goa', state: 'Goa', hub: 'Panaji KTC / Mapusa / Madgaon' },
  { name: 'Manali', state: 'Himachal Pradesh', hub: 'Private Bus Stand / Mall Road' },
  { name: 'Shimla', state: 'Himachal Pradesh', hub: 'ISBT Tutikandi / Victory Tunnel' },
  { name: 'Phagwara', state: 'Punjab', hub: 'Central Bus Stand / GT Road' },
  { name: 'Amritsar', state: 'Punjab', hub: 'ISBT Amritsar / Golden Temple Road' },
  { name: 'Dehradun', state: 'Uttarakhand', hub: 'ISBT Dehradun / Clock Tower' },
  { name: 'Haridwar', state: 'Uttarakhand', hub: 'Haridwar Central Bus Stand' },
  { name: 'Rishikesh', state: 'Uttarakhand', hub: 'Natraj Chowk / Bus Stand' },
  { name: 'Kolkata', state: 'West Bengal', hub: 'Esplanade / Babughat Terminus' },
  { name: 'Surat', state: 'Gujarat', hub: 'Kamrej Cross Roads / Central Station' },
  { name: 'Indore', state: 'Madhya Pradesh', hub: 'Sarwate Bus Stand / Vijay Nagar' },
  { name: 'Bhopal', state: 'Madhya Pradesh', hub: 'ISBT Bhopal / Nadra Bus Stand' },
  { name: 'Varanasi', state: 'Uttar Pradesh', hub: 'Cantt Bus Station / Lahartara' },
];

export function getUnifiedCities(dynamicCities = []) {
  const map = new Map();
  // First add all catalog cities
  for (const c of INDIAN_CITIES_CATALOG) {
    map.set(c.name.toLowerCase(), c);
  }
  // Then add any dynamic cities not in catalog
  for (const name of dynamicCities) {
    if (typeof name === 'string' && name.trim()) {
      const lower = name.trim().toLowerCase();
      if (!map.has(lower)) {
        map.set(lower, {
          name: name.trim(),
          state: 'India',
          hub: 'Central Bus Station',
        });
      }
    }
  }
  return Array.from(map.values());
}

export function filterCities(allCities, query = '') {
  const q = (query || '').trim().toLowerCase();
  if (!q) {
    return allCities.slice(0, 10);
  }

  // Exact prefix match first, then substring match
  const prefixMatches = [];
  const substringMatches = [];

  for (const city of allCities) {
    const nameLower = city.name.toLowerCase();
    const stateLower = (city.state || '').toLowerCase();
    const hubLower = (city.hub || '').toLowerCase();

    if (nameLower.startsWith(q)) {
      prefixMatches.push(city);
    } else if (
      nameLower.includes(q) ||
      stateLower.includes(q) ||
      hubLower.includes(q)
    ) {
      substringMatches.push(city);
    }
  }

  return [...prefixMatches, ...substringMatches].slice(0, 12);
}
