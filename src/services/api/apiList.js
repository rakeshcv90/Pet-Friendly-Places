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
  // GET the signed-in account's Urbania bookings (requests and confirmed trips)
  MY_URBANIA_BOOKINGS: '/accounts/me/urbania-bookings',
  // POST { reference, name, phone, details }: asks staff to check ownership of a booking. Path is a
  // best guess until it is confirmed against the API docs.
  URBANIA_STAFF_REVIEW: '/accounts/me/urbania-bookings/ownership-review',
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
  // GET reads and PATCH changes { notifyHealthRemindersEmail }: email reminders only, not push
  PET_HEALTH_SETTINGS: petId => `/pets/${petId}/health-settings`,
  // PATCH edits a record's details; DELETE archives it (restorable, 204 No Content)
  PET_HEALTH_RECORD: (petId, recordId) => `/pets/${petId}/health-records/${recordId}`,
  PET_HEALTH_ARCHIVED: petId => `/pets/${petId}/health-records/archived`,
  PET_HEALTH_RESTORE: (petId, recordId) => `/pets/${petId}/health-records/${recordId}/restore`,
  // POST one vaccination entry: vaccineName, dateAdministered and/or dueDate, batch, clinic, vet
  PET_HEALTH_VACCINATIONS: (petId, recordId) =>
    `/pets/${petId}/health-records/${recordId}/vaccinations`,
  // POST arranges the pages newest first; PATCH .../files/order sets a chosen order
  PET_HEALTH_ORGANIZE: (petId, recordId) => `/pets/${petId}/health-records/${recordId}/organize`,
  PET_HEALTH_FILES_ORDER: (petId, recordId) =>
    `/pets/${petId}/health-records/${recordId}/files/order`,
  // POST starts reading one file / every page; suggestions stay unconfirmed until approved
  PET_HEALTH_EXTRACT: (petId, recordId, fileId) =>
    `/pets/${petId}/health-records/${recordId}/files/${fileId}/extract`,
  PET_HEALTH_EXTRACT_BULK: (petId, recordId) =>
    `/pets/${petId}/health-records/${recordId}/extract/bulk`,
  PET_HEALTH_EXTRACT_APPROVE: (petId, recordId, fileId) =>
    `/pets/${petId}/health-records/${recordId}/files/${fileId}/extract/approve`,
  // GET the confirmed vaccine history; POST .../due-date { entryId, dueDate } confirms a due date
  PET_HEALTH_HISTORY: petId => `/pets/${petId}/health-history`,
  // GET ?q= searches clinics and vets; POST links the chosen one to a vaccination entry
  // with { listingId }
  PET_HEALTH_VET_SUGGESTIONS: petId => `/pets/${petId}/health-records/vet-suggestions`,
  PET_HEALTH_VET_CONFIRM: (petId, recordId, entryId) =>
    `/pets/${petId}/health-records/${recordId}/vaccinations/${entryId}/vet-confirm`,
  PET_HEALTH_HISTORY_DUE_DATE: petId => `/pets/${petId}/health-history/due-date`,
  PET_HEALTH_RECORD_FILES: (petId, recordId) => `/pets/${petId}/health-records/${recordId}/files`,
  // GET returns the image bytes (not JSON) and needs the Bearer token; ?variant=processed falls back
  // to the stored original when no processed copy exists yet
  PET_HEALTH_RECORD_FILE: (petId, recordId, fileId) =>
    `/pets/${petId}/health-records/${recordId}/files/${fileId}`,
  // Public profile by slug (no sign-in needed). The response carries the pet's id
  PET_BY_SLUG: slug => `/pets/by-slug/${slug}`,
  // GET { followerCount, viewerFollowing }. POST follows, DELETE unfollows: both need the Bearer
  // token and answer { following, followerCount }
  PET_FOLLOWERS: petId => `/pets/${petId}/followers`,
  PET_FOLLOW: petId => `/pets/${petId}/follow`,
  // GET { following: [{ id, petName, slug, species, breed, photo, level, followerCount, followedAt }] }:
  // the pets the signed-in user follows (Bearer token). Unfollow is DELETE PET_FOLLOW(id).
  ME_FOLLOWING: '/me/following',
  // GET the comments visible to the viewer; POST { body } adds one (sign-in needed)
  PET_MEDIA_COMMENTS: mediaId => `/pets/media/${mediaId}/comments`,
  // GET { likeCount, viewerLiked }; POST toggles the viewer's like and answers the new state
  PET_MEDIA_LIKES: mediaId => `/pets/media/${mediaId}/likes`,
  // Public pawsport: pet name, stamp total, distinct places, stamp details
  PAWSPORT: petSlug => `/traveller/${petSlug}/pawsport`,

  SAVED_PLACE: listingId => `/accounts/me/saved/${listingId}`,

  TRIPS: '/trips',

  LEADERBOARD: '/leaderboard',

  COMMUNITY: {
    LIST: '/community/communities',
    // POST { communitySlug } toggles: joins when not a member, leaves when already one. Answers
    // { joined, memberCount }
    MEMBERSHIPS: '/community/memberships',
    // GET (signed in) answers { joined, memberCount } for the current user
    MEMBERSHIP: communitySlug => `/community/memberships/${communitySlug}`,
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
