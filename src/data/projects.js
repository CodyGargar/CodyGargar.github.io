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
      'Hand rehabilitation platform built at YHack Spring 2026. Guides patients through exercises using computer vision to track joint movement and provide real-time corrective feedback.',
    tech: ['Python', 'OpenCV', 'React'],
    links: [
      { label: 'GitHub',  url: '#',  icon: '⌥' },
      { label: 'Devpost', url: '#',  icon: '⬡' },
      { label: 'Demo',    url: '#',  icon: '▶' },
    ],
  },
  pitPerfect: {
    id: 'pitPerfect',
    title: 'PitPerfect',
    district: 'Software Gulch',
    description:
      'AI-powered pitch coaching tool that listens as you present and delivers real-time feedback on pacing, filler words, energy, and overall delivery — built for founders and public speakers.',
    tech: ['JavaScript', 'Web Speech API', 'Claude API'],
    links: [
      { label: 'GitHub',  url: '#', icon: '⌥' },
      { label: 'Devpost', url: '#', icon: '⬡' },
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
  github: {
    id: 'github',
    title: 'GitHub',
    district: 'The Telegraph Office',
    description:
      "Browse all of Edgar's open-source work, hackathon submissions, and personal projects — all in one place.",
    tech: [],
    links: [
      { label: 'Visit GitHub', url: 'https://github.com/arevaloe', icon: '⌥' },
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
      { label: 'Visit LinkedIn', url: 'https://linkedin.com/in/arevaloe', icon: '↗' },
    ],
  },
};
