/** All project data keyed by id, one entry per building. */
export const projects = {
  particleAi: {
    id: 'particleAi',
    title: 'Particle AI',
    district: 'Software Gulch',
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
    description:
      'Wearable glove that digitizes hand rehabilitation, built at YHack Spring 2026. 12-bit flex sensors map finger motion to precise biometric data, giving patients an objective baseline of hand flexibility and targeted recovery exercises instead of guesswork.',
    tech: ['C++', 'Hardware', 'MediaPipe', 'Next.js', 'TypeScript'],
    links: [
      { label: 'GitHub',  url: 'https://github.com/notAidven/YHACK-26',  icon: '⌥' },
      { label: 'Devpost', url: 'https://devpost.com/software/arthai',  icon: '⬡' },
      { label: 'Demo',    url: '#',  icon: '▶' },
    ],
  },
  pitPerfect: {
    id: 'pitPerfect',
    title: 'PitPerfect',
    district: 'Software Gulch',
    description:
      'AI-powered F1 race-strategy platform built at HackTX 2025, where it won MLH\'s Best .Tech Domain Name prize. Analyzes race footage and telemetry with Gemini to detect car damage, highlights it on an interactive 3D car model, and recommends pit-stop calls.',
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
    description:
      'Robotic feeding arm built at the FormLabs Hackathon (IAP 2026). Uses ROS and computer vision to help users with limited upper-body mobility eat independently.',
    tech: ['ROS', 'Python', '3D Printing', 'OpenCV'],
    links: [
      { label: 'GitHub',  url: '#', icon: '⌥' },
      { label: 'Devpost', url: '#', icon: '⬡' },
    ],
  },
  firstStep: {
    id: 'firstStep',
    title: 'FirstStep AI',
    district: 'Software Gulch',
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
      "EECS student at MIT, currently interning as a Software Engineer at Amazon. Most of what's in this town got built over a single sleepless hackathon weekend — robotic arms, gait trackers, pitch coaches — usually aimed at rehabilitation, accessibility, or just making something a little less tedious. Always tinkering with the next one.",
    tech: [],
    links: [
      { label: 'GitHub', url: 'https://github.com/CodyGargar', icon: '⌥' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/edgar--arevalo/', icon: '↗' },
      { label: 'This site', url: 'https://github.com/CodyGargar/portfolio-town', icon: '⌥' },
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
