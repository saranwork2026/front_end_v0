/**
 * Birth-place reference data for horoscope chart generation — FRONTEND ONLY
 * (same rationale as religionCasteData.ts / cityData.ts). Unlike cityData.ts
 * (partner-preference city names only), each entry here carries the
 * latitude / longitude / IANA timezone the chart engine needs, so selecting a
 * place auto-fills those. This is a curated, India-focused list (all IST) plus
 * a few common NRI destinations — a lightweight offline alternative to bundling
 * the full GeoNames dataset. Anything not listed can still be entered via the
 * manual latitude/longitude fallback.
 *
 * Coordinates are city-centre approximations (sufficient: for a 30°-wide sign
 * placement, a few km of positional error is immaterial). Labels are
 * "City, State" for disambiguation and search.
 */

export interface BirthPlace {
  label: string
  lat: number
  lon: number
  timezone: string
}

const IST = 'Asia/Kolkata'

/** India: metros, all state/UT capitals, and major district cities. */
const INDIA: Array<[string, number, number]> = [
  // Metros & major cities
  ['Mumbai, Maharashtra', 19.076, 72.8777],
  ['Delhi, Delhi', 28.6139, 77.209],
  ['New Delhi, Delhi', 28.6139, 77.209],
  ['Bengaluru, Karnataka', 12.9716, 77.5946],
  ['Hyderabad, Telangana', 17.385, 78.4867],
  ['Chennai, Tamil Nadu', 13.0827, 80.2707],
  ['Kolkata, West Bengal', 22.5726, 88.3639],
  ['Pune, Maharashtra', 18.5204, 73.8567],
  ['Ahmedabad, Gujarat', 23.0225, 72.5714],
  ['Surat, Gujarat', 21.1702, 72.8311],
  ['Jaipur, Rajasthan', 26.9124, 75.7873],
  ['Lucknow, Uttar Pradesh', 26.8467, 80.9462],
  ['Kanpur, Uttar Pradesh', 26.4499, 80.3319],
  ['Nagpur, Maharashtra', 21.1458, 79.0882],
  ['Indore, Madhya Pradesh', 22.7196, 75.8577],
  ['Bhopal, Madhya Pradesh', 23.2599, 77.4126],
  ['Patna, Bihar', 25.5941, 85.1376],
  ['Vadodara, Gujarat', 22.3072, 73.1812],
  ['Ludhiana, Punjab', 30.901, 75.8573],
  ['Agra, Uttar Pradesh', 27.1767, 78.0081],
  ['Nashik, Maharashtra', 19.9975, 73.7898],
  ['Varanasi, Uttar Pradesh', 25.3176, 82.9739],
  ['Meerut, Uttar Pradesh', 28.9845, 77.7064],
  ['Rajkot, Gujarat', 22.3039, 70.8022],
  ['Jabalpur, Madhya Pradesh', 23.1815, 79.9864],
  ['Aurangabad, Maharashtra', 19.8762, 75.3433],
  // State / UT capitals
  ['Amaravati, Andhra Pradesh', 16.5417, 80.5157],
  ['Itanagar, Arunachal Pradesh', 27.0844, 93.6053],
  ['Dispur, Assam', 26.1433, 91.7898],
  ['Guwahati, Assam', 26.1445, 91.7362],
  ['Raipur, Chhattisgarh', 21.2514, 81.6296],
  ['Panaji, Goa', 15.4909, 73.8278],
  ['Gandhinagar, Gujarat', 23.2156, 72.6369],
  ['Chandigarh, Chandigarh', 30.7333, 76.7794],
  ['Shimla, Himachal Pradesh', 31.1048, 77.1734],
  ['Ranchi, Jharkhand', 23.3441, 85.3096],
  ['Srinagar, Jammu and Kashmir', 34.0837, 74.7973],
  ['Jammu, Jammu and Kashmir', 32.7266, 74.857],
  ['Thiruvananthapuram, Kerala', 8.5241, 76.9366],
  ['Kochi, Kerala', 9.9312, 76.2673],
  ['Kozhikode, Kerala', 11.2588, 75.7804],
  ['Thrissur, Kerala', 10.5276, 76.2144],
  ['Imphal, Manipur', 24.817, 93.9368],
  ['Shillong, Meghalaya', 25.5788, 91.8933],
  ['Aizawl, Mizoram', 23.7271, 92.7176],
  ['Kohima, Nagaland', 25.6751, 94.1086],
  ['Bhubaneswar, Odisha', 20.2961, 85.8245],
  ['Gangtok, Sikkim', 27.3389, 88.6065],
  ['Agartala, Tripura', 23.8315, 91.2868],
  ['Dehradun, Uttarakhand', 30.3165, 78.0322],
  ['Port Blair, Andaman and Nicobar Islands', 11.6234, 92.7265],
  ['Kavaratti, Lakshadweep', 10.5626, 72.6369],
  ['Puducherry, Puducherry', 11.9416, 79.8083],
  // Tamil Nadu (deeper coverage — primary audience)
  ['Coimbatore, Tamil Nadu', 11.0168, 76.9558],
  ['Madurai, Tamil Nadu', 9.9252, 78.1198],
  ['Tiruchirappalli, Tamil Nadu', 10.7905, 78.7047],
  ['Salem, Tamil Nadu', 11.6643, 78.146],
  ['Tirunelveli, Tamil Nadu', 8.7139, 77.7567],
  ['Erode, Tamil Nadu', 11.341, 77.7172],
  ['Vellore, Tamil Nadu', 12.9165, 79.1325],
  ['Thanjavur, Tamil Nadu', 10.787, 79.1378],
  ['Thoothukudi, Tamil Nadu', 8.7642, 78.1348],
  ['Dindigul, Tamil Nadu', 10.3624, 77.9695],
  ['Kanchipuram, Tamil Nadu', 12.8342, 79.7036],
  ['Cuddalore, Tamil Nadu', 11.748, 79.7714],
  ['Kumbakonam, Tamil Nadu', 10.9602, 79.3845],
  ['Nagercoil, Tamil Nadu', 8.1833, 77.4119],
  ['Karur, Tamil Nadu', 10.9601, 78.0766],
  ['Sivakasi, Tamil Nadu', 9.4533, 77.7973],
  ['Namakkal, Tamil Nadu', 11.2189, 78.1677],
  ['Pudukkottai, Tamil Nadu', 10.3833, 78.8001],
  ['Ramanathapuram, Tamil Nadu', 9.3639, 78.8395],
  ['Virudhunagar, Tamil Nadu', 9.568, 77.9624],
  ['Tiruppur, Tamil Nadu', 11.1075, 77.3398],
  ['Tiruvannamalai, Tamil Nadu', 12.2253, 79.0747],
  ['Villupuram, Tamil Nadu', 11.9394, 79.4924],
  ['Sivaganga, Tamil Nadu', 9.8433, 78.4809],
  ['Theni, Tamil Nadu', 10.0104, 77.4768],
  ['Krishnagiri, Tamil Nadu', 12.5186, 78.2137],
  ['Dharmapuri, Tamil Nadu', 12.1211, 78.1583],
  ['Ariyalur, Tamil Nadu', 11.1401, 79.0782],
  ['Perambalur, Tamil Nadu', 11.2342, 78.8807],
  ['Nagapattinam, Tamil Nadu', 10.7656, 79.8424],
  ['Tenkasi, Tamil Nadu', 8.9594, 77.3152],
  // Other commonly-cited cities
  ['Mysuru, Karnataka', 12.2958, 76.6394],
  ['Mangaluru, Karnataka', 12.9141, 74.856],
  ['Hubballi, Karnataka', 15.3647, 75.124],
  ['Belagavi, Karnataka', 15.8497, 74.4977],
  ['Vijayawada, Andhra Pradesh', 16.5062, 80.648],
  ['Visakhapatnam, Andhra Pradesh', 17.6868, 83.2185],
  ['Tirupati, Andhra Pradesh', 13.6288, 79.4192],
  ['Guntur, Andhra Pradesh', 16.3067, 80.4365],
  ['Warangal, Telangana', 17.9689, 79.5941],
  ['Nizamabad, Telangana', 18.6725, 78.0941],
  ['Amritsar, Punjab', 31.634, 74.8723],
  ['Jalandhar, Punjab', 31.326, 75.5762],
  ['Jodhpur, Rajasthan', 26.2389, 73.0243],
  ['Udaipur, Rajasthan', 24.5854, 73.7125],
  ['Kota, Rajasthan', 25.2138, 75.8648],
  ['Gwalior, Madhya Pradesh', 26.2183, 78.1828],
  ['Allahabad, Uttar Pradesh', 25.4358, 81.8463],
  ['Bareilly, Uttar Pradesh', 28.367, 79.4304],
  ['Aligarh, Uttar Pradesh', 27.8974, 78.088],
  ['Gorakhpur, Uttar Pradesh', 26.7606, 83.3732],
  ['Noida, Uttar Pradesh', 28.5355, 77.391],
  ['Ghaziabad, Uttar Pradesh', 28.6692, 77.4538],
  ['Gurugram, Haryana', 28.4595, 77.0266],
  ['Faridabad, Haryana', 28.4089, 77.3178],
  ['Panipat, Haryana', 29.3909, 76.9635],
  ['Howrah, West Bengal', 22.5958, 88.2636],
  ['Durgapur, West Bengal', 23.5204, 87.3119],
  ['Siliguri, West Bengal', 26.7271, 88.3953],
  ['Cuttack, Odisha', 20.4625, 85.8828],
  ['Jamshedpur, Jharkhand', 22.8046, 86.2029],
  ['Dhanbad, Jharkhand', 23.7957, 86.4304],
  ['Solapur, Maharashtra', 17.6599, 75.9064],
  ['Kolhapur, Maharashtra', 16.705, 74.2433],
  ['Thane, Maharashtra', 19.2183, 72.9781],
  ['Navi Mumbai, Maharashtra', 19.033, 73.0297],
  ['Bhavnagar, Gujarat', 21.7645, 72.1519],
  ['Jamnagar, Gujarat', 22.4707, 70.0577],
]

/** Common NRI destinations (with their own timezones). */
const OVERSEAS: Array<[string, number, number, string]> = [
  ['Singapore', 1.3521, 103.8198, 'Asia/Singapore'],
  ['Dubai, UAE', 25.2048, 55.2708, 'Asia/Dubai'],
  ['Abu Dhabi, UAE', 24.4539, 54.3773, 'Asia/Dubai'],
  ['Doha, Qatar', 25.2854, 51.531, 'Asia/Qatar'],
  ['Kuala Lumpur, Malaysia', 3.139, 101.6869, 'Asia/Kuala_Lumpur'],
  ['London, United Kingdom', 51.5074, -0.1278, 'Europe/London'],
  ['New York, USA', 40.7128, -74.006, 'America/New_York'],
  ['New Jersey, USA', 40.0583, -74.4057, 'America/New_York'],
  ['San Francisco, USA', 37.7749, -122.4194, 'America/Los_Angeles'],
  ['Toronto, Canada', 43.6532, -79.3832, 'America/Toronto'],
  ['Sydney, Australia', -33.8688, 151.2093, 'Australia/Sydney'],
  ['Melbourne, Australia', -37.8136, 144.9631, 'Australia/Melbourne'],
  ['Colombo, Sri Lanka', 6.9271, 79.8612, 'Asia/Colombo'],
]

export const BIRTH_PLACES: BirthPlace[] = [
  ...INDIA.map(([label, lat, lon]) => ({ label, lat, lon, timezone: IST })),
  ...OVERSEAS.map(([label, lat, lon, timezone]) => ({ label, lat, lon, timezone })),
]

/** Options for a searchable dropdown (value === label; look up coords by label). */
export const BIRTH_PLACE_OPTIONS = BIRTH_PLACES.map((p) => ({ value: p.label, label: p.label }))

/** Resolve a selected label back to its coordinates + timezone. */
export function findBirthPlace(label: string): BirthPlace | undefined {
  return BIRTH_PLACES.find((p) => p.label === label)
}
