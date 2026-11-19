// Content of the Community info popup. Block types:
//   h2 { kicker, text } / h3 { text }, p { parts: [string | { b: string }] }, callout { tone, title, text },
//   divider, faq { q, a }
export const COMMUNITY_INFO_TITLE = 'About Tails Community';

export const COMMUNITY_INFO_BLOCKS = [
  { type: 'h2', kicker: 'THE WHY', text: "Why India's pet parents needed a place like this" },
  {
    type: 'p',
    parts: [
      "Every day, somewhere in India, a pet parent types a question into a WhatsApp group, can dogs travel in a train's AC coach, which vet in this city answers on a Sunday, is that “pet friendly” resort actually pet friendly, and gets a genuinely good answer from someone who has lived it. And then the answer dies. It scrolls away, locked inside a group of two hundred people, and tomorrow someone in another city types the same question into another group and starts from zero.",
    ],
  },
  {
    type: 'p',
    parts: [
      "That is the strange state of pet parenting in India: lakhs of us, most of us the first generation in our families to raise a dog or cat indoors as family, all solving the same problems in private, over and over. The international forums don't help much, their answers assume US airlines, fenced suburban yards, and pet stores on every corner. Nobody there has an answer for a housing society's pet rules, an indie pup's first monsoon, or what a leopard-country evening walk should look like.",
    ],
  },
  {
    type: 'p',
    parts: [
      'Tails Community exists to break that loop. It is a community for Indian pet parents where questions and answers are ',
      { b: 'public, permanent, and searchable' },
      ', so a good answer written once in Dehradun helps a stranger in Coimbatore two years later. Ask anything. Answer what you know. What gets solved here, stays solved.',
    ],
  },
  { type: 'divider' },

  {
    type: 'h2',
    kicker: 'ON THE ROAD',
    text: 'Lessons the road taught us (so you can skip the hard way)',
  },
  {
    type: 'p',
    parts: [
      "This community is run by the team behind Pet Friendly Places, we travel India with our own three dogs and verify places before they wear a badge. These are the lessons that shaped how this whole platform works, and they're a good preview of the kind of honest, specific knowledge this community is for.",
    ],
  },
  { type: 'h3', text: '“Pet friendly” on the internet means almost nothing' },
  {
    type: 'p',
    parts: [
      "Early on, we found a hotel tagged pet-friendly across travel sites, while the hotel's own rulebook said pets were not permitted on the premises. Imagine driving five hours with an excited dog to discover that at reception. It's why this site verifies against the property itself, and it's why the best answers in this community come from someone who has actually stood at that gate with a dog. When you answer here, say how you know.",
    ],
  },
  { type: 'h3', text: 'The real question is always about the fine print' },
  {
    type: 'callout',
    tone: 'purple',
    title: 'Ask the narrower question',
    text: 'Some genuinely pet-friendly stays welcome pets in private rooms but never in dorms. Some welcome dogs but not on the lawns. Some are free, some charge per pet per night. “Is it pet friendly?” gets you a yes. “Where exactly can my dog be, and what does it cost?” gets you a trip that works. The best questions in this community name the dog, the place, and the detail.',
  },
  { type: 'h3', text: 'Your vaccination card is a travel document, treat it like one' },
  {
    type: 'p',
    parts: [
      "India's better pet spaces are getting stricter, and that's a good thing: the best dog parks and daycares now check vaccination records at the gate, no card, no entry. Trains require a fitness certificate from a vet on top of it. Photograph every page of your pet's card, keep the original in the glovebox, and you'll never lose a plan to paperwork.",
    ],
  },
  { type: 'h3', text: 'The hills are wonderful, and they have their own rules' },
  {
    type: 'callout',
    tone: 'amber',
    title: 'Leopard country is real',
    text: 'Above a certain altitude in Uttarakhand and much of hill India, property owners will tell you plainly: leopards are around, keep the leash on. Dawn and dusk walks stay short and close. Dogs sleep indoors. None of this should stop you from taking your dog to the mountains, it should just change how you do it. Ask the people here who go every season.',
  },
  { type: 'divider' },

  { type: 'h2', kicker: 'WHAT TO ASK', text: 'The questions this community was built for' },
  {
    type: 'p',
    parts: [
      'The practical ones: which trains take a large dog from Delhi (and what the First AC coupe rule actually involves). Whether that beach in Goa minds dogs in the morning. Where the genuinely fenced, off-leash-allowed parks are in Delhi NCR, Mumbai, or Bengaluru, and which “dog parks” are just parks with a tolerant guard.',
    ],
  },
  {
    type: 'p',
    parts: [
      "The first-timer ones: what an adopted indie needs in the first month. What a pup's first monsoon does to walk routines. How to read a housing society's pet rules, and your rights within them. What to pack for a first road trip, and what everyone packs but never uses.",
    ],
  },
  {
    type: 'p',
    parts: [
      "The local ones: a vet who answers late-night calls in your city. A groomer who's patient with an anxious cat. A pet event happening near you this weekend, and whether it was any good last year. If you've lived an answer, someone here needs it.",
    ],
  },
  { type: 'divider' },

  { type: 'h2', kicker: 'GOOD TO KNOW', text: 'Frequently asked questions' },
  {
    type: 'faq',
    q: 'Is there an online community or forum for pet parents in India?',
    a: "There are many WhatsApp and Facebook pet groups in India, and they're valuable, but their answers vanish into chat history and can't be found by the next person searching. Tails Community is built the other way: a public, searchable Q&A community for Indian pet parents, where every answered question becomes a permanent page anyone can find.",
  },
  {
    type: 'faq',
    q: 'How is this different from a WhatsApp pet group?',
    a: 'Three ways. Answers here are permanent and searchable instead of scrolling away. Good answers rise, the community upvotes, and the person who asked marks what actually solved it. And it\'s moderated: new members\' posts are reviewed before going live, spam and hidden promotion are removed, and medical-dosage "advice" is never allowed to stand.',
  },
  {
    type: 'faq',
    q: 'Can I trust the advice here?',
    a: 'Trust it the way you\'d trust a well-travelled friend: excellent for lived experience, never a substitute for a professional. Nothing here is veterinary advice, for anything medical, see a registered vet. What we do enforce: honesty rules (people say how they know what they claim), disclosure rules for anyone connected to a business they mention, and verified badges, the same "verified means we checked" principle as our directory, rolling out for professionals in the community.',
  },
  {
    type: 'faq',
    q: 'Is Tails Community free?',
    a: 'Yes. Create a free account, join the communities that fit your life, by city or by topic, and start asking or answering.',
  },
  {
    type: 'faq',
    q: 'I run a pet business. Can I participate?',
    a: 'Yes, openly. Answer questions in your area of expertise and say who you are, disclosed expertise is welcome and respected here. Hidden promotion, affiliate links, and drive-by advertising are removed, and repeat offenders are banned. Business verification badges are coming; genuinely helpful businesses will want one.',
  },
  {
    type: 'faq',
    q: 'My dog is an indie. Is this community for me?',
    a: "Especially for you. Indies are travel companions, trek partners, and family, one of our own three dogs is an indie, and every pet-friendly place we've verified treats the vaccination card as the document that matters, not a pedigree paper. Adoption and rescue have a dedicated community here.",
  },
];
