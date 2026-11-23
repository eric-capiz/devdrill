export const LEVELS = ["Junior", "Mid", "Senior"] as const;
export type Level = (typeof LEVELS)[number];

export const TRACKS = ["Frontend", "A+"] as const;
export type Track = (typeof TRACKS)[number];

export const QUIZ_LENGTHS = [5, 10, 15, 20, 25, "Unlimited"] as const;
export type QuizLength = (typeof QUIZ_LENGTHS)[number];

export const SUBJECTS = {
  Frontend: [
    "HTML",
    "CSS / Less / Sass",
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "APIs & Fetch",
    "Browser APIs / DOM",
    "Accessibility",
    "Performance",
    "Testing",
    "Tooling",
  ],
  "A+": [
    "Hardware",
    "Networking",
    "Mobile Devices",
    "Printers",
    "Virtualization & Cloud",
    "Operating Systems",
    "Security",
    "Software Troubleshooting",
    "Operational Procedures",
  ],
} as const satisfies Record<Track, readonly string[]>;

export type SubjectForTrack<T extends Track> = (typeof SUBJECTS)[T][number];
