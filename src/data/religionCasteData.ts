/**
 * Religion / Sect / Caste reference data — FRONTEND ONLY.
 *
 * Deliberately not a backend Java enum and not a database lookup table:
 *   - The backend fields (religion, caste, subCaste, gothram) stay plain
 *     Strings, unchanged. No schema migration, no redeploy needed to add
 *     a new caste later — just edit this file.
 *   - A DB-backed lookup table was considered and rejected: it would mean
 *     a network round trip + DB query for every profile load just to
 *     populate a dropdown, for data that changes rarely. This static list
 *     ships in the JS bundle instead (same pattern as bloodGroupOptions,
 *     manglikOptions, etc. elsewhere in the wizard).
 *   - Caste is intentionally scoped BY religion (selecting "Hindu" shows
 *     Hindu castes, "Christian" shows Christian denominations, etc.) since
 *     the two vocabularies don't overlap — this mirrors how real Indian
 *     matrimony platforms (BharatMatrimony et al.) structure the same form.
 *
 * Data source: adapted from a public Indian-matrimony religion/caste
 * reference dataset (community-maintained, similar in shape to the lists
 * used by major matrimony platforms) — see
 * https://gist.github.com/Dhaneshmonds/8e8c4ffbcae16d1bc07cdda0f08d70e1
 * This is a best-effort list, not authoritative. Caste/community naming
 * varies by region and transliteration; every religion ends in "Other" so
 * no one is blocked if their community isn't listed. Please correct or
 * extend as real user feedback comes in — see docs/business-rules.md for
 * the governance note on this list.
 *
 * Design decisions (also recorded in docs/business-rules.md):
 *   - Religion and Sect are SEPARATE fields (not combined like
 *     "Muslim - Shia" as a single religion value). Sect currently applies
 *     to Muslim (Sunni/Shia) and Jain (Digambar/Shwetambar) only.
 *   - Explicit non-religious / non-disclosure options are first-class
 *     religion values, not omissions: "No Religious Belief", "Inter-Religion"
 *     (mixed-religion family), and "Prefer not to say".
 *   - Caste/community/gothram are all optional fields (see
 *     UserProfileRequest-equivalent validation) — many users legitimately
 *     don't have or don't wish to disclose one.
 */

export interface CasteOption {
  value: string;
  label: string;
}

// ---- Religion --------------------------------------------------------

// NOTE ON VALUE FORMAT: values are the human-readable label text itself
// (e.g. "Hindu", "Brahmin"), NOT machine codes like "HINDU". This matches
// how the backend field is stored (plain String, no enum) and how the rest
// of the app already reads/writes this data — PartnerPreferencesPage's
// religion/caste multi-selects and SearchPage's free-text religion/caste
// filters both use the same human-readable strings. Using a different value
// convention here (e.g. uppercase codes) would silently break partner
// preference matching and search, since MatchEngineService does plain
// string equality between profile.religion/caste and the preference lists.

export const RELIGIONS: CasteOption[] = [
  { value: 'Hindu', label: 'Hindu' },
  { value: 'Muslim', label: 'Muslim' },
  { value: 'Christian', label: 'Christian' },
  { value: 'Sikh', label: 'Sikh' },
  { value: 'Jain', label: 'Jain' },
  { value: 'Buddhist', label: 'Buddhist' },
  { value: 'Parsi', label: 'Parsi' },
  { value: 'Jewish', label: 'Jewish' },
  { value: 'Inter-Religion', label: 'Inter-Religion' },
  { value: 'No Religious Belief', label: 'No Religious Belief' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
  { value: 'Other', label: 'Other' },
];

// ---- Sect (only shown for religions that have one) --------------------

export const SECTS_BY_RELIGION: Record<string, CasteOption[]> = {
  Muslim: [
    { value: 'Sunni', label: 'Sunni' },
    { value: 'Shia', label: 'Shia' },
    { value: 'Unspecified', label: 'Unspecified' },
  ],
  Jain: [
    { value: 'Digambar', label: 'Digambar' },
    { value: 'Shwetambar', label: 'Shwetambar' },
    { value: 'Unspecified', label: 'Unspecified' },
  ],
};

/** Religions with no meaningful caste/community concept — caste field is hidden entirely. */
const NO_CASTE_RELIGIONS = new Set([
  'Inter-Religion',
  'No Religious Belief',
  'Prefer not to say',
]);

export function hasSect(religion: string): boolean {
  return religion in SECTS_BY_RELIGION;
}

export function hasCasteField(religion: string): boolean {
  return !NO_CASTE_RELIGIONS.has(religion);
}

/** Gothram is a Hindu/Jain concept — hidden for all other religions. */
export function hasGothramField(religion: string): boolean {
  return religion === 'Hindu' || religion === 'Jain';
}

// ---- Caste / Community, scoped by religion -----------------------------
// "Other" is always appended as an escape hatch so no one is blocked.

const HINDU_CASTES: string[] = [
  'Ad Dharmi', 'Adi Andhra', 'Adi Dravida', 'Adi-karnataka', 'Agarwal',
  'Agnikula Kshatriya', 'Agri', 'Ahir Shimpi', 'Ahom', 'Ambalavasi',
  'Arekatica', 'Arora', 'Arunthathiyar', 'Arya Vysya', 'Ayyaraka', 'Badaga',
  'Bagdi', 'Baidya', 'Baishnab', 'Baishya', 'Bajantri', 'Balija',
  'Banayat Oriya', 'Banik', 'Baniya', 'Baniya - Bania', 'Baniya - Kumuti',
  'Banjara', 'Barai', 'Bari', 'Baria', 'Barujibi', 'Besta', 'Bhandari',
  'Bhatia', 'Bhatraju', 'Bhavasar Kshatriya', 'Bhoi', 'Bhovi', 'Bhoyar',
  'Billava', 'Bishnoi/Vishnoi', 'Bondili', 'Boyer', 'Brahmbatt', 'Brahmin',
  'Brahmin - Anavil', 'Brahmin - Audichya', 'Brahmin - Barendra',
  'Brahmin - Bhatt', 'Brahmin - Bhumihar', 'Brahmin - Daivadnya',
  'Brahmin - Danua', 'Brahmin - Deshastha', 'Brahmin - Dhiman',
  'Brahmin - Dravida', 'Brahmin - Embrandiri', 'Brahmin - Garhwali',
  'Brahmin - Gaur', 'Brahmin - Goswami', 'Brahmin - Gujar Gaur',
  'Brahmin - Gurukkal', 'Brahmin - Halua', 'Brahmin - Havyaka',
  'Brahmin - Hoysala', 'Brahmin - Iyengar', 'Brahmin - Iyer',
  'Brahmin - Jangid', 'Brahmin - Jhadua', 'Brahmin - Jyotish',
  'Brahmin - Kanyakubj', 'Brahmin - Karhade', 'Brahmin - Khandelwal',
  'Brahmin - Kokanastha', 'Brahmin - Kota', 'Brahmin - Kulin',
  'Brahmin - Kumoani', 'Brahmin - Madhwa', 'Brahmin - Maithil',
  'Brahmin - Modh', 'Brahmin - Mohyal', 'Brahmin - Nagar',
  'Brahmin - Namboodiri', 'Brahmin - Narmadiya', 'Brahmin - Niyogi',
  'Brahmin - Paliwal', 'Brahmin - Panda', 'Brahmin - Pandit',
  'Brahmin - Pareek', 'Brahmin - Pushkarna', 'Brahmin - Rarhi',
  'Brahmin - Rigvedi', 'Brahmin - Rudraj', 'Brahmin - Sakaldwipi',
  'Brahmin - Sanadya', 'Brahmin - Sanketi', 'Brahmin - Saraswat',
  'Brahmin - Saryuparin', 'Brahmin - Shivhalli', 'Brahmin - Shrimali',
  'Brahmin - Sikhwal', 'Brahmin - Smartha', 'Brahmin - Sri Vishnava',
  'Brahmin - Stanika', 'Brahmin - Tyagi', 'Brahmin - Vaidiki',
  'Brahmin - Vaikhanasa', 'Brahmin - Velanadu', 'Brahmin - Vyas',
  'Brajastha Maithil', 'Bunt (Shetty)', 'CKP', 'Chalawadi and Holeya',
  'Chambhar', 'Chandravanshi Kahar', 'Chasa', 'Chattada Sri Vaishnava',
  'Chaudary', 'Chaurasia', 'Chennadasar', 'Chettiar', 'Chhetri',
  'Chippolu (Mera)', 'Coorgi', 'Devadiga', 'Devandra Kula Vellalar',
  'Devang Koshthi', 'Devanga', 'Devrukhe Brahmin', 'Dhangar', 'Dheevara',
  'Dhiman', 'Dhoba', 'Dhobi', 'Dhor / Kakkayya', 'Dommala', 'Dumal',
  'Dusadh (Paswan)', 'Ediga', 'Ezhava', 'Ezhuthachan', 'Gabit', 'Ganda',
  'Gandla', 'Ganiga', 'Garhwali', 'Gatti', 'Gavara', 'Gawali', 'Ghisadi',
  'Ghumar', 'Goala', 'Goan', 'Gomantak', 'Gondhali', 'Goud', 'Gounder',
  'Gowda', 'Gramani', 'Gudia', 'Gujjar', 'Gupta', 'Guptan', 'Gurav',
  'Gurjar', 'Halba Koshti', 'Helava', 'Hugar (Jeer)', 'Intercaste', 'Irani',
  'Jaalari', 'Jaiswal', 'Jandra', 'Jangam', 'Jangra - Brahmin', 'Jat',
  'Jatav', 'Jetty/Malla', 'Jogi (Nath)', 'Kachara', 'Kadava Patel', 'Kahar',
  'Kaibarta', 'Kalal', 'Kalanji', 'Kalar', 'Kalinga', 'Kalinga Vysya',
  'Kalita', 'Kalwar', 'Kamboj', 'Kamma', 'Kansari', 'Kapu', 'Karana',
  'Karmakar', 'Karuneegar', 'Kasar', 'Kashyap', 'Katiya',
  'Kavuthiyya/Ezhavathy', 'Kayastha', 'Khandayat', 'Khandelwal', 'Kharwa',
  'Kharwar', 'Khatri', 'Kirar', 'Kokanastha Maratha', 'Koli', 'Koli Mahadev',
  'Koli Patel', 'Kongu Vellala Gounder', 'Konkani', 'Korama', 'Kori',
  'Kosthi', 'Krishnavaka', 'Kshatriya', 'Kudumbi', 'Kulal', 'Kulalar',
  'Kulita', 'Kumawat', 'Kumbhakar', 'Kumbhar', 'Kumhar', 'Kummari', 'Kunbi',
  'Kuravan', 'Kurmi', 'Kurmi Kshatriya', 'Kuruba', 'Kuruhina Shetty',
  'Kurumbar', 'Kushwaha (Koiri)', 'Kutchi', 'Lambadi', 'Leva patel',
  'Leva patil', 'Lingayath', 'Lodhi Rajput', 'Lohana', 'Lohar', 'Loniya',
  'Lubana', 'Madiga', 'Mahajan', 'Mahar', 'Mahendra', 'Maheshwari',
  'Mahishya', 'Majabi', 'Mala', 'Mali', 'Malla', 'Malviya Brahmin',
  'Mangalorean', 'Manipuri', 'Mapila', 'Maratha', 'Maruthuvar', 'Matang',
  'Mathur', 'Maurya / Shakya', 'Meena', 'Meenavar', 'Mehra', 'Meru Darji',
  'Mochi', 'Modak', 'Mogaveera', 'Mudaliyar', 'Mudiraj', 'Mukkulathor',
  'Munnuru Kapu', 'Muthuraja', 'Naagavamsam', 'Nadar', 'Nagaralu', 'Nai',
  'Naicker', 'Naidu', 'Naik', 'Nair', 'Nambiar', 'Namosudra', 'Napit',
  'Nayaka', 'Neeli', 'Nepali', 'Nhavi', 'Oswal', 'Otari', 'Padmasali', 'Pal',
  'Panchal', 'Pandaram', 'Panicker', 'Parkava Kulam', 'Parsi', 'Partraj',
  'Pasi', 'Patel', 'Pathare Prabhu', 'Patnaick', 'Patra', 'Perika', 'Pillai',
  'Poosala', 'Porwal', 'Prajapati', 'Raigar', 'Rajaka', 'Rajastani',
  'Rajbhar', 'Rajbonshi', 'Rajpurohit', 'Rajput', 'Ramanandi', 'Ramdasia',
  'Ramgariah', 'Ramoshi', 'Ravidasia', 'Rawat', 'Reddy', 'Relli', 'Ror',
  'SC', 'SKP', 'ST', 'Sadgope', 'Saha', 'Sahu', 'Saini', 'Saliya',
  'Sathwara', 'Savji', 'Senai Thalaivar', 'Senguntha Mudaliyar',
  'Settibalija', 'Shimpi', 'Sindhi', 'Sindhi-Amil', 'Sindhi-Baibhand',
  'Sindhi-Bhanusali', 'Sindhi-Bhatia', 'Sindhi-Chhapru', 'Sindhi-Dadu',
  'Sindhi-Hyderabadi', 'Sindhi-Larai', 'Sindhi-Larkana', 'Sindhi-Lohana',
  'Sindhi-Rohiri', 'Sindhi-Sahiti', 'Sindhi-Sakkhar', 'Sindhi-Sehwani',
  'Sindhi-Shikarpuri', 'Sindhi-Thatai', 'Sonar', 'Soni', 'Sourashtra',
  'Sozhiya Vellalar', 'Srisayana', 'Sugali (Naika)', 'Sunari', 'Sundhi',
  'Surya Balija', 'Suthar', 'Swakula Sali', 'Tamboli', 'Tanti', 'Tantubai',
  'Telaga', 'Teli', 'Thakkar', 'Thakore', 'Thakur', 'Thigala', 'Thiyya',
  'Tili', 'Togata', 'Tonk Kshatriya', 'Turupu Kapu', 'Uppara',
  'Urali Gounder', 'Urs', 'Vada Balija', 'Vaddera', 'Vaish', 'Vaishnav',
  'Vaishnava', 'Vaishya', 'Vaishya Vani', 'Valluvan', 'Valmiki', 'Vania',
  'Vanika Vyshya', 'Vaniya', 'Vanjara', 'Vanjari', 'Vankar', 'Vannar',
  'Vannia Kula Kshatriyar', 'Variar', 'Varshney', 'Veera Saivam', 'Velaan',
  'Velama', 'Vellalar', 'Veluthedathu Nair', 'Vettuva Gounder',
  'Vilakkithala Nair', 'Viswabrahmin', 'Viswakarma', 'Vokkaliga', 'Vysya',
  'Yadav', 'Yellapu',
];

const MUSLIM_CASTES: string[] = [
  'Ansari', 'Arain', 'Awan', 'Alavi - Bohra', 'Dakhini', 'Dudekula',
  'Hanafi', 'Jat', 'Khoja', 'Labbay', 'Malik', 'Mappila', 'Marakayar',
  'Memon', 'Mughal', 'Pathan', 'Qureshi', 'Rajput', 'Rowther', 'Shafi',
  'Sheikh', 'Siddiqui', 'Syed', 'Unspecified',
];

const CHRISTIAN_DENOMINATIONS: string[] = [
  'Adventist', 'Anglican / Episcopal', 'Apostolic', 'Assyrian',
  'Assembly of God (AG)', 'Baptist', 'Calvinist', 'Born Again', 'Bretheren',
  'Church of South India', 'Evangelist', 'Jacobite', 'Knanaya',
  'Knanaya Catholic', 'Knanaya Jacobite', 'Latin Catholic', 'Malankara',
  'Marthoma', 'Pentacost', 'Roman Catholic', 'Syrian Catholic',
  'Syrian Jacobite', 'Syrian Orthodox', 'Syro Malabar', 'Unspecified',
  'Church of God', 'Church of Christ', 'Church of North India',
  'Congregational', 'East Indian Catholic', "Jehovah's Witnesses",
  'Latter Day Saints', 'Lutheran', 'Melkite',
  'Malabar Independent Syrian Church', 'Mennonite', 'Methodist', 'Moravian',
  'Protestant', 'Presbyterian', 'Seventh-day Adventist', 'Reformed Baptist',
  'Reformed Presbyterian', "St. Thomas Evangelical",
];

const SIKH_CASTES: string[] = [
  'Ahluwalia', 'Arora', 'Bhatia', 'Ghumar', 'Intercaste', 'Jat', 'Kamboj',
  'Khatri', 'Kshatriya', 'Lubana', 'Majabi', 'Nai', 'No Bar', 'Rajput',
  'Ramdasia', 'Ramgharia', 'Saini', 'Ravidasia', 'Bhatra', 'Tonk Kshatriya',
  'Unspecified',
];

const JAIN_CASTES: string[] = [
  'Agarwal', 'Bania', 'Intercaste', 'Jaiswal', 'Khandelwal', 'Kutchi',
  'No Bar', 'Oswal', 'Porwal', 'Unspecified', 'Vaishya', 'KVO',
];

const PARSI_CASTES: string[] = ['Irani', 'Parsi', 'Intercaste'];

const BUDDHIST_SECTS_AS_CASTE: string[] = [
  'Mahayana', 'Nichiren Buddhism', 'Pure Land Buddhism',
  'Tantrayana (Vajrayana Tibetan)', 'Theravada (Hinayana)',
  'Tendai Buddhism (Japanese)', 'Zen Buddhism (China)',
];

function toOptionsWithOther(names: string[]): CasteOption[] {
  // Value = label text itself (see note above on value format).
  const options = names.map((name) => ({ value: name, label: name }));
  options.push({ value: 'Other', label: 'Other' });
  return options;
}

export const CASTES_BY_RELIGION: Record<string, CasteOption[]> = {
  Hindu: toOptionsWithOther(HINDU_CASTES),
  Muslim: toOptionsWithOther(MUSLIM_CASTES),
  Christian: toOptionsWithOther(CHRISTIAN_DENOMINATIONS),
  Sikh: toOptionsWithOther(SIKH_CASTES),
  Jain: toOptionsWithOther(JAIN_CASTES),
  Parsi: toOptionsWithOther(PARSI_CASTES),
  Buddhist: toOptionsWithOther(BUDDHIST_SECTS_AS_CASTE),
  Jewish: [{ value: 'Other', label: 'Other' }],
  Other: [{ value: 'Other', label: 'Other' }],
};

export function getCasteOptions(religion: string): CasteOption[] {
  return CASTES_BY_RELIGION[religion] ?? [];
}

// ---- Gothram (Hindu / Jain) --------------------------------------------
// Draft list, not exhaustive — see file header note on data provenance.

const GOTHRAMS: string[] = [
  'Bharadwaja', 'Vashista', 'Kashyapa', 'Kaundinya', 'Vishwamitra',
  'Atreya', 'Agastya', 'Gautama', 'Shandilya', 'Harita', 'Vatsa',
  'Kaushika', 'Parashara', 'Gargeya', 'Angirasa',
];

// "None" is offered first for users who don't have / don't follow a gothram;
// "Other" is still appended by toOptionsWithOther as the escape hatch.
export const GOTHRAM_OPTIONS: CasteOption[] = [
  { value: 'None', label: 'None' },
  ...toOptionsWithOther(GOTHRAMS),
];

// ---- Mother Tongue (frontend-only enum, per user request) --------------

export const MOTHER_TONGUES: CasteOption[] = toOptionsWithOther([
  'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Hindi', 'Marathi', 'Gujarati',
  'Punjabi', 'Bengali', 'Odia', 'Assamese', 'Urdu', 'Konkani', 'Sindhi',
  'Kashmiri', 'Sanskrit', 'English',
]);
