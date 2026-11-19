// Website (not the API): used for links that open in the browser, e.g. the community guidelines
export const WEB_BASE_URL = 'https://petfriendlyplaces.in';

//  export const API_BASE_URL = "https://af764897-7306-4080-80a7-e25f9325ccdf-00-1p3we5yilmeoo-8k9dg7jy.sisko.replit.dev/api"
export const API_BASE_URL = 'https://petfriendlyplaces.in/api'; //Live Url

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/account/mobile/login',
    REGISTER: '/auth/account/register',
    FORGOT_PASSWORD: '/auth/account/forgot-password',
    REFRESH_TOKEN: '/auth/account/mobile/refresh',
    LOGOUT: '/auth/account/mobile/logout',
    LOGOUT_ALL: '/auth/account/mobile/logout-all',
  },

  // User Profile & Preferences
  USER: {
    PROFILE: '/auth/account/mobile/me',
    HOME_DATA: '/discovery/mobile-home',
    CITIES: '/discovery/cities',
    ROAD_TRIP: '/routes?status=published',
    TRAVEL_STORY: '/stories',
    // One story by slug: GET /stories/{slug}
    TRAVEL_STORY_DETAIL: slug => `/stories/${encodeURIComponent(slug)}`,
    ARTICLES: '/articles',
    // REQUEST_CITY: '/mobile/cities/known',
    REQUEST_CITY: '/cities/known',
  },

  // Public transport guides: the hub lists the mode cards, a mode returns its hub + vehicles
  TRANSPORT: {
    LIST: '/transport',
    MODE: '/transport/mode',
  },

  LISTINGS: {
    SEARCH: '/listings/search',
    LIST: '/listings',
  },

  // POST multipart (bearer token + Idempotency-Key). Live environment only.
  PLACE_SUBMIT: '/places/submit',
  // GET the signed-in account's own place submissions
  MY_PLACE_SUBMISSIONS: '/me/place-submissions',

  SAVED_PLACES: '/accounts/me/saved',
  // GET the signed-in account's profile privacy switches; PATCH one switch at a time
  PRIVACY: '/accounts/me/privacy',
  // The signed-in account's pets
  MY_PETS: '/me/pets',
  // The signed-in account's notifications. GET list, GET unread-count,
  // POST mark-read { ids: [] }, POST mark-all-read
  NOTIFICATIONS: {
    LIST: '/me/notifications',
    UNREAD_COUNT: '/me/notifications/unread-count',
    MARK_READ: '/me/notifications/mark-read',
    MARK_ALL_READ: '/me/notifications/mark-all-read',
  },
  // POST creates a pet: { petName, species, breed, bio? }
  PETS: '/pets',
  // PATCH updates one pet
  PET: petId => `/pets/${petId}`,
  // POST multipart { photo, purpose: 'profile_photo' | 'banner' }
  PET_PHOTO: petId => `/pets/${petId}/photo`,
  // Adventures gallery. POST multipart { media, title?, description? } and GET take ?type=photo|video
  PET_MEDIA: petId => `/pets/${petId}/media`,
  // A pet's private health records. GET list, POST create (JSON). Photos are added one at a time:
  // POST multipart { file } to .../health-records/{recordId}/files
  PET_HEALTH_RECORDS: petId => `/pets/${petId}/health-records`,
  PET_HEALTH_RECORD_FILES: (petId, recordId) => `/pets/${petId}/health-records/${recordId}/files`,
  // Public pawsport: pet name, stamp total, distinct places, stamp details
  PAWSPORT: petSlug => `/traveller/${petSlug}/pawsport`,

  SAVED_PLACE: listingId => `/accounts/me/saved/${listingId}`,

  TRIPS: '/trips',

  LEADERBOARD: '/leaderboard',

  COMMUNITY: {
    LIST: '/community/communities',
    MEMBERSHIPS: '/community/memberships',
    MY_ACTIVITY: '/community/my-activity',
    MEDIA_UPLOAD: '/community/media/upload',
    POSTS: '/community/posts',
    POST_DETAIL: slug => `/community/posts/${slug}`,
    POST_REPLIES: slug => `/community/posts/${slug}/replies`,
    POST_ACCEPT: slug => `/community/posts/${slug}/accept`,
    REPORTS: '/community/reports',
  },

  REUNITE: {
    // GET lists cases. POST JSON creates a draft case and returns its case_code
    CASES: '/reunite/cases',

    CASE_PHOTOS: caseCode => `/reunite/cases/${caseCode}/photos`,

    // POST with no body returns the contact number. Needs a signed-in account.
    CASE_REVEAL_PHONE: caseId => `/reunite/cases/${caseId}/reveal-phone`,

    // POST creates a pet alert. Needs a signed-in account with a verified email.
    ALERTS: '/reunite/alerts',

    CASE_SUBMIT: caseCode => `/reunite/cases/${caseCode}/submit`,
  },
};

export default API_ENDPOINTS;
