// js/data.js
export const SHOP = {
  name: 'Palm & Blade',
  tagline: 'Sharp cuts, slow afternoons.',
  established: 2014,
  address: { street: '1867 Sunset Mesa Dr', city: 'El Cajon', state: 'CA', zip: '92020' },
  phone: '(619) 555-0147',
  phoneHref: 'tel:+16195550147',
  email: 'hello@palmandblade.com',
  instagram: '@palmandblade',
  stats: { years: 12, cuts: 30000, barbers: 4, rating: 4.9 },
};

// day: 0 = Sunday ... 6 = Saturday. open/close in 24h "HH:MM". null = closed.
export const HOURS = [
  { day: 0, label: 'Sunday',    open: '10:00', close: '15:00' },
  { day: 1, label: 'Monday',    open: null,    close: null },
  { day: 2, label: 'Tuesday',   open: '09:00', close: '19:00' },
  { day: 3, label: 'Wednesday', open: '09:00', close: '19:00' },
  { day: 4, label: 'Thursday',  open: '09:00', close: '19:00' },
  { day: 5, label: 'Friday',    open: '09:00', close: '19:00' },
  { day: 6, label: 'Saturday',  open: '08:00', close: '17:00' },
];

export const SERVICE_CATEGORIES = [
  { id: 'cuts',   label: 'Cuts' },
  { id: 'beard',  label: 'Beard & shave' },
  { id: 'combos', label: 'Combos' },
  { id: 'addons', label: 'Add-ons' },
];

export const SERVICES = [
  { id: 'classic-cut',  category: 'cuts',   name: 'Classic Cut',            price: 35, minutes: 45, featured: true,  description: 'Clippers and shears, tailored to you, finished with a hot-towel neck shave.' },
  { id: 'skin-fade',    category: 'cuts',   name: 'Skin Fade',              price: 40, minutes: 45, featured: true,  description: 'Bald to blended, with a sharp lineup.' },
  { id: 'taper-fade',   category: 'cuts',   name: 'Taper Fade',             price: 38, minutes: 45, featured: false, description: 'Clean, low-key taper that grows out well.' },
  { id: 'scissor-cut',  category: 'cuts',   name: 'Scissor Cut',            price: 45, minutes: 60, featured: false, description: 'Longer styles and textured crops, all shears.' },
  { id: 'kids-cut',     category: 'cuts',   name: "Kids' Cut (12 & under)", price: 25, minutes: 30, featured: false, description: 'Patient, quick, and lollipop included.' },
  { id: 'senior-cut',   category: 'cuts',   name: 'Senior Cut (65+)',       price: 25, minutes: 30, featured: false, description: 'A classic cut at a kinder price.' },
  { id: 'beard-trim',   category: 'beard',  name: 'Beard Trim & Lineup',    price: 20, minutes: 20, featured: false, description: 'Even length, crisp edges.' },
  { id: 'beard-sculpt', category: 'beard',  name: 'Beard Sculpt',           price: 30, minutes: 30, featured: false, description: 'Shaping, straight-razor lines, hot towel, and beard oil.' },
  { id: 'hot-towel',    category: 'beard',  name: 'Hot Towel Shave',        price: 35, minutes: 40, featured: true,  description: 'Straight razor, three hot towels, cold-towel finish.' },
  { id: 'cut-beard',    category: 'combos', name: 'Cut + Beard',            price: 50, minutes: 60, featured: false, description: 'Any cut plus a beard trim and lineup.' },
  { id: 'the-works',    category: 'combos', name: 'The Works',              price: 65, minutes: 75, featured: false, description: 'Any cut, beard sculpt, hot towel, and a scalp massage.' },
  { id: 'design',       category: 'addons', name: 'Design / freestyle',     price: 10, minutes: 15, featured: false, addon: true, description: 'Lines, parts, or a freestyle design.' },
  { id: 'eyebrows',     category: 'addons', name: 'Eyebrow cleanup',        price: 5,  minutes: 5,  featured: false, addon: true, description: 'Quick, clean, natural.' },
];

export const BARBERS = [
  {
    id: 'marco', name: 'Marco Reyes', firstName: 'Marco', role: 'Owner', years: 14,
    specialties: ['Classic cuts', 'Tapers', 'Hot towel shaves'],
    days: [2, 3, 4, 5, 6],
    bio: 'Marco started cutting hair in his garage at sixteen and never stopped. He opened Palm & Blade to build the kind of shop he grew up in, where everybody knows your name and nobody rushes you.',
    quote: 'A good cut is ten minutes of skill and thirty of listening.',
    instagram: '@marco.cuts', image: 'assets/img/barber-marco.webp',
  },
  {
    id: 'dee', name: 'Denise "Dee" Washington', firstName: 'Dee', role: 'Fade specialist', years: 8,
    specialties: ['Skin fades', 'Designs', 'Line work'],
    days: [2, 3, 4, 5, 6],
    bio: "Dee is the shop's fade specialist and its resident artist. If you want a freestyle design, a part that could cut glass, or a fade so smooth it looks airbrushed, she's your barber.",
    quote: "If you can see the line, I'm not done.",
    instagram: '@deefades', image: 'assets/img/barber-dee.webp',
  },
  {
    id: 'tommy', name: 'Tommy Nguyen', firstName: 'Tommy', role: 'Stylist', years: 6,
    specialties: ['Textured crops', 'Scissor work', 'Modern styles'],
    days: [0, 3, 4, 5, 6],
    bio: 'Tommy keeps the shop current. He trained in scissor work in Los Angeles and loves turning "I don\'t know, something different" into a style you\'ll get compliments on all week.',
    quote: 'Bring me a photo, or bring me nothing. Both work.',
    instagram: '@tommy.shears', image: 'assets/img/barber-tommy.webp',
  },
  {
    id: 'sami', name: 'Sami Haddad', firstName: 'Sami', role: 'Beard & shave specialist', years: 10,
    specialties: ['Beard sculpting', 'Straight-razor shaves'],
    days: [0, 2, 4, 5, 6],
    bio: "Sami's family has been cutting hair in El Cajon for two generations. He's the beard expert, and his hot towel shave has a waitlist of regulars who swear by it.",
    quote: "Patience and a sharp razor. That's the whole secret.",
    instagram: '@sami.razor', image: 'assets/img/barber-sami.webp',
  },
];

export const REVIEWS = [
  { name: 'Jordan M.', barber: 'dee',   text: "Dee is an artist. Best fade I've had in San Diego, period." },
  { name: 'Alicia R.', barber: 'marco', text: 'Brought my 6-year-old in screaming, he left asking when he can come back. Marco is a saint.' },
  { name: 'Chris T.',  barber: 'sami',  text: "Sami's hot towel shave is worth every penny. Felt like a new man." },
  { name: 'Andre L.',  barber: null,    text: 'Chill vibes, great music, zero wait with an appointment. My new spot.' },
  { name: 'Kevin P.',  barber: 'tommy', text: 'Tommy actually listened to what I wanted. Rare.' },
  { name: 'Luis G.',   barber: 'marco', text: "Been going to Marco for nine years. Wouldn't trust anyone else." },
  { name: 'Isaiah W.', barber: 'dee',   text: 'Got a design for my birthday and the whole office asked who did it.' },
  { name: 'Daniel K.', barber: null,    text: 'Clean shop, fair prices, and they remembered my name the second time.' },
];

// Before/after pairs for the Home slider and the Barbers gallery.
export const GALLERY = [
  { id: 'cut-01', style: 'Low taper fade',           barber: 'marco', before: 'assets/img/cut-01-before.webp', after: 'assets/img/cut-01-after.webp' },
  { id: 'cut-02', style: 'Burst fade with design',   barber: 'dee',   before: 'assets/img/cut-02-before.webp', after: 'assets/img/cut-02-after.webp' },
  { id: 'cut-03', style: 'Textured crop',            barber: 'tommy', before: 'assets/img/cut-03-before.webp', after: 'assets/img/cut-03-after.webp' },
  { id: 'cut-04', style: 'Beard sculpt and lineup',  barber: 'sami',  before: 'assets/img/cut-04-before.webp', after: 'assets/img/cut-04-after.webp' },
  { id: 'cut-05', style: 'Classic side part',        barber: 'marco', before: 'assets/img/cut-05-before.webp', after: 'assets/img/cut-05-after.webp' },
  { id: 'cut-06', style: "Kids' skin fade",          barber: 'dee',   before: 'assets/img/cut-06-before.webp', after: 'assets/img/cut-06-after.webp' },
];

export const FAQ = [
  { q: 'Do you take walk-ins?', a: "Yes, when a chair's open. Booking ahead guarantees your spot, especially on Saturdays." },
  { q: 'How do I pay?', a: 'Cash, card, Apple Pay, and Google Pay.' },
  { q: 'What if I need to cancel?', a: 'No problem. Just give us a call at least two hours before your appointment.' },
  { q: 'Is there parking?', a: 'Free parking in the lot behind the shop.' },
  { q: "Do you cut kids' hair?", a: "All the time. Kids' cuts are $25 for ages 12 and under." },
];

// Helpers
export const formatPrice = (n, addon = false) => `${addon ? '+' : ''}$${n}`;
export const getService = (id) => SERVICES.find((s) => s.id === id);
export const getBarber  = (id) => BARBERS.find((b) => b.id === id);
