// Demo data to check the Saved Places design without an account or network.
// Off, so the screen shows the account's real saved places (GET /accounts/me/saved).
// Set SHOW_DEMO_SAVED_PLACES to true only to look at the design with sample data.
export const SHOW_DEMO_SAVED_PLACES = false;

const photo = seed => `https://picsum.photos/seed/${seed}/800/500`;

// Same shape as a listing from the API
export const DEMO_SAVED_PLACES = [
  {
    id: 9001,
    slug: 'demo-paws-and-brew-cafe',
    name: 'Paws & Brew Cafe',
    category: 'Cafes',
    city: 'Bangalore',
    address: 'Indiranagar, Bangalore',
    google_rating: 4.7,
    tails_verified: true,
    main_image_url: photo('paws-brew'),
  },
  {
    id: 9002,
    slug: 'demo-the-leaf-pet-resort',
    name: 'The Leaf Pet Resort & Spa, Coorg',
    category: 'Stays',
    city: 'Coorg',
    address: 'Madikeri, Coorg',
    google_rating: 4.5,
    verification_status: 'verified',
    main_image_url: photo('leaf-resort'),
  },
  {
    id: 9003,
    slug: 'demo-cubbon-dog-park',
    name: 'Cubbon Park Off-Leash Zone',
    category: 'Parks',
    city: 'Bangalore',
    address: 'Kasturba Road, Bangalore',
    user_average_rating: 4.2,
  },
  {
    id: 9004,
    slug: 'demo-goa-beach-shack',
    name: 'Sunset Shack Beach Cafe',
    category: 'Cafes',
    city: 'Goa',
    address: 'Palolem, Goa',
    main_image_url: photo('goa-shack'),
  },
];
