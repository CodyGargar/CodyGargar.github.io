/**
 * URL for a file in public/. Vite's BASE_URL is '/' in dev and './' in the
 * build (see vite.config.js), so photos resolve wherever the site is hosted.
 */
const asset = (path) => `${import.meta.env.BASE_URL}${path}`;

/**
 * All project data keyed by id, one entry per building.
 *
 * Optional fields shown as badges / used for ordering on the classic site:
 *   event     hackathon name + date, e.g. 'HackTX 2025'
 *   award     prize won at that event
 *   team      team size (omit for solo work)
 *   kind      short label when there's no event, e.g. 'Personal project'
 *   rank      sort order within its district tab (lower first; default last)
 *   featured  if set, shown in the Featured row, in this order
 *   images    [{ src, alt, focus? }] photos under public/, first one is the cover;
 *             focus is a CSS object-position for crops, e.g. 'center 25%'
 *   youtube   YouTube video id, embedded on the 3D project page
 * A link labeled 'Live …' (e.g. 'Live site', 'Live demo') earns a "Live" badge.
 */
export const projects = {
  particleAi: {
    id: 'particleAi',
    title: 'Particle AI',
    district: 'Software Gulch',
    kind: 'Personal project',
    rank: 3,
    description:
      'AI particle assistant dashboard — speak or type to an animated particle cloud that answers questions, searches the web, and morphs into shapes representing the concept, while controlling 40+ panels spanning productivity, gaming, fitness, and dev tools.',
    tech: ['JavaScript', 'Claude API', 'Web Speech API'],
    links: [
      { label: 'GitHub', url: 'https://github.com/CodyGargar/particle-dashboard', icon: '⌥' },
    ],
  },
  arthAi: {
    id: 'arthAi',
    title: 'ArthAi',
    district: 'Hardware Frontier',
    event: 'YHack Spring 2026',
    team: 2,
    rank: 2,
    description:
      'Wearable glove that digitizes hand rehabilitation. 12-bit flex sensors map finger motion to precise biometric data, giving patients an objective baseline of hand flexibility and targeted recovery exercises instead of guesswork.',
    tech: ['C++', 'Hardware', 'MediaPipe', 'Next.js', 'TypeScript'],
    links: [
      { label: 'GitHub',  url: 'https://github.com/notAidven/YHACK-26',  icon: '⌥' },
      { label: 'Devpost', url: 'https://devpost.com/software/arthai',  icon: '⬡' },
      { label: 'Demo',    url: '#',  icon: '▶' },
    ],
    images: [
      { src: asset('projects/arthai/glove-on-the-bench.jpg'), alt: 'ArthAi glove prototype on a workbench: finger tendons and green spools wired to a breadboard and motion sensor, with code on a laptop behind it' },
      { src: asset('projects/arthai/wearing-the-glove.jpg'), alt: 'Edgar wearing the ArthAi rehab glove at YHack', focus: 'center 25%' },
    ],
  },
  pitPerfect: {
    id: 'pitPerfect',
    title: 'PitPerfect',
    district: 'Software Gulch',
    event: 'HackTX 2025',
    award: 'MLH Best .Tech Domain Name',
    team: 4,
    rank: 1,
    featured: 2,
    description:
      'AI-powered F1 race-strategy platform. Analyzes race footage and telemetry with Gemini to detect car damage, highlights it on an interactive 3D car model, and recommends pit-stop calls.',
    tech: ['TypeScript', 'Next.js', 'Three.js', 'Python', 'FastAPI', 'Gemini API', 'OpenCV'],
    links: [
      { label: 'GitHub',  url: 'https://github.com/CodyGargar/PitPerfect', icon: '⌥' },
      { label: 'Devpost', url: 'https://devpost.com/software/pitperfect', icon: '⬡' },
      { label: 'Demo',    url: '#', icon: '▶' },
    ],
  },
  assist: {
    id: 'assist',
    title: 'Assist',
    district: 'Hardware Frontier',
    event: 'FormLabs Hackathon · IAP 2026',
    rank: 3,
    description:
      'Robotic feeding arm that uses ROS and computer vision to help users with limited upper-body mobility eat independently.',
    tech: ['ROS', 'Python', '3D Printing', 'OpenCV'],
    links: [
      { label: 'GitHub',  url: '#', icon: '⌥' },
      { label: 'Devpost', url: '#', icon: '⬡' },
    ],
  },
  brainBuddy: {
    id: 'brainBuddy',
    title: 'Brain Buddy',
    district: 'Hardware Frontier',
    event: 'HackMIT 2026',
    team: 4,
    rank: 1,
    featured: 1,
    description:
      'A $30 ESP32 wristband that helps someone with dementia keep their own routine. It holds a reminder until the wearer is in the right room (estimated from WiFi signal), confirms it with a wrist shake, nudges night wandering once, and points the way home when a GPS geofence trips. A caregiver dashboard sets the routine and trades voice messages, all over home WiFi with no cloud or subscription.',
    tech: ['ESP32', 'C++', 'PlatformIO', 'Python', 'JavaScript', 'SQLite', 'GPS', 'IMU'],
    links: [
      { label: 'Live demo', url: 'https://jpt1729.github.io/hackmit/', icon: '▶' },
      { label: 'Video', url: 'https://youtu.be/PGITm6_xXBQ', icon: '▶' },
      { label: 'GitHub', url: 'https://github.com/jpt1729/hackmit', icon: '⌥' },
    ],
    youtube: 'PGITm6_xXBQ',
    images: [
      { src: asset('projects/brain-buddy/wristband-reminder.jpg'), alt: 'Brain Buddy wristband on a wrist, its LED ring glowing and OLED showing a reminder, in front of the project slide' },
      { src: asset('projects/brain-buddy/wristband-lit.jpg'), alt: 'Brain Buddy wristband with its green LED ring lit, wired to the prototype electronics' },
      { src: asset('projects/brain-buddy/esp32-and-oled.jpg'), alt: 'ESP32 board in a blue 3D-printed case next to the small OLED display' },
      { src: asset('projects/brain-buddy/wiring-the-prototype.jpg'), alt: 'Wiring the prototype at a workbench with solder, wire strippers, and jumper wires' },
    ],
  },
  firstStep: {
    id: 'firstStep',
    title: 'FirstStep AI',
    district: 'Software Gulch',
    kind: 'Hackathon project',
    rank: 5,
    description:
      'Gait analysis system that uses a Raspberry Pi camera and TensorFlow pose estimation to detect walking irregularities and deliver rehabilitation feedback in real time.',
    tech: ['TensorFlow', 'Raspberry Pi', 'OpenCV', 'Python'],
    links: [
      { label: 'GitHub',  url: '#', icon: '⌥' },
      { label: 'Devpost', url: '#', icon: '⬡' },
    ],
  },
  arevalosAuto: {
    id: 'arevalosAuto',
    title: "Arevalo's Auto Repair",
    district: 'Software Gulch',
    kind: 'Small-business site',
    rank: 2,
    featured: 3,
    description:
      'Bilingual marketing site for a transmission rebuild shop in Irving, TX. Plain HTML/CSS/JS with no build step: SEO-focused service pages, quote forms, and a full Spanish mirror written for how local customers actually talk, linked to the English pages with hreflang tags.',
    tech: ['HTML', 'CSS', 'JavaScript', 'SEO'],
    links: [
      { label: 'Live site', url: 'https://arevalostransmissions.com', icon: '▶' },
      { label: 'GitHub', url: 'https://github.com/CodyGargar/arevalos-site', icon: '⌥' },
    ],
  },
  billSplit: {
    id: 'billSplit',
    title: 'Bill Split',
    district: 'Software Gulch',
    kind: 'Personal project',
    rank: 4,
    description:
      'Mobile-friendly app for splitting group grocery runs. Scan a receipt and Claude reads every line item, or paste a list; then tap to assign who shares what, set weighted custom splits, and get itemized per-person totals.',
    tech: ['React', 'Node.js', 'Express', 'Claude API'],
    links: [
      { label: 'GitHub', url: 'https://github.com/CodyGargar/bill-split', icon: '⌥' },
    ],
  },
  shootySpace: {
    id: 'shootySpace',
    title: 'Shooty Space Game',
    district: 'Software Gulch',
    kind: 'Personal project',
    rank: 6,
    description:
      'Top-down arcade space shooter written as a single Java file: fly a ship through an asteroid field and blast your way through, with the ship, asteroids, and projectiles rendered in AWT/Swing.',
    tech: ['Java', 'Swing', 'AWT'],
    links: [
      { label: 'GitHub', url: 'https://github.com/CodyGargar/ShootySpaceGame', icon: '⌥' },
    ],
  },
  github: {
    id: 'github',
    title: 'GitHub',
    district: 'The Telegraph Office',
    description:
      "Browse all of Edgar's open-source work, hackathon submissions, and personal projects — all in one place.",
    tech: [],
    links: [
      { label: 'Visit GitHub', url: 'https://github.com/CodyGargar', icon: '⌥' },
    ],
  },
  linkedin: {
    id: 'linkedin',
    title: 'LinkedIn',
    district: 'The Telegraph Office',
    description:
      'EECS @ MIT · Amazon SWE Intern · Interested in robotics, AI, and building things that help people. Connect or reach out.',
    tech: [],
    links: [
      { label: 'Visit LinkedIn', url: 'https://www.linkedin.com/in/edgar--arevalo/', icon: '↗' },
    ],
  },
  devpost: {
    id: 'devpost',
    title: 'Devpost',
    district: 'The Telegraph Office',
    description:
      "See the hackathon submissions behind ArthAi, Assist, FirstStep AI, and PitPerfect — write-ups, demos, and the teams that built them.",
    tech: [],
    links: [
      { label: 'Visit Devpost', url: 'https://devpost.com', icon: '⬡' },
    ],
  },
  aboutMe: {
    id: 'aboutMe',
    title: 'About Me',
    district: 'The Telegraph Office',
    description:
      "EECS student at MIT, currently interning as a Software Engineer at Amazon. Most of what's in this town got built over a single sleepless hackathon weekend — robotic arms, gait trackers, rehab gloves, F1 pit-strategy AI — usually aimed at rehabilitation, accessibility, or just making something a little less tedious. Always tinkering with the next one.",
    tech: [],
    links: [
      { label: 'GitHub', url: 'https://github.com/CodyGargar', icon: '⌥' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/edgar--arevalo/', icon: '↗' },
      { label: 'This site', url: 'https://github.com/CodyGargar/CodyGargar.github.io', icon: '⌥' },
    ],
  },
};

/** Name + one-line headline shown at the top of the classic site. */
export const profile = {
  name: 'Edgar Arevalo',
  headline: 'EECS @ MIT · Amazon SWE Intern',
};

/**
 * Direct contact details, shown in the classic site's Contact section.
 * Leave a field as '' to show it as "coming soon" instead of a live link.
 */
export const contact = {
  email: 'arevaloe@mit.edu',
  phone: '+1 (972) 330-9353',
};
