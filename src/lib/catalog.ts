export const LEVELS = ["Junior", "Mid", "Senior", "All"] as const;
export type Level = (typeof LEVELS)[number];

export const TRACKS = ["Frontend", "Backend", "Fullstack", "DevOps"] as const;
export type Track = (typeof TRACKS)[number];

export const QUIZ_LENGTHS = [10, 20, 30, 40, 50, "Unlimited"] as const;
export type QuizLength = (typeof QUIZ_LENGTHS)[number];

export const SUBJECTS = {
  Frontend: [
    "HTML",
    "CSS / Less / Sass",
    "JavaScript",
    "TypeScript",
    "React",
    "Vue",
    "Angular",
    "State management (Redux, Zustand, Pinia, etc.)",
    "Next.js",
    "Browser APIs / DOM",
    "Accessibility",
    "Performance",
    "Testing (Jest, Vitest, Playwright, Cypress)",
    "Tooling (Vite, Webpack, npm/pnpm)",
  ],
  Backend: [
    "Express / Node",
    "APIs (REST, GraphQL)",
    "Python (Flask / FastAPI / Django)",
    "Databases (SQL, NoSQL, ORM)",
    "Auth (sessions, JWT, OAuth)",
    "Security",
    "Caching (Redis)",
    "Background jobs / queues",
    "Validation & error handling",
    "Testing",
    "Architecture (layers, services, clean structure)",
  ],
  Fullstack: [
    "Fullstack mix",
    "Client ↔ API integration",
    "Auth across client and server",
    "SSR / hydration",
    "Env / config",
    "Deploying a full app",
  ],
  DevOps: [
    "Git / GitHub",
    "CI/CD",
    "Docker",
    "Linux / shell basics",
    "Hosting / cloud (Vercel, AWS, etc.)",
    "Env vars & secrets",
    "Monitoring / logging",
    "Networking basics (DNS, HTTPS, reverse proxies)",
    "Nginx / reverse proxy",
    "Infrastructure as code (Terraform basics)",
  ],
} as const satisfies Record<Track, readonly string[]>;

export type SubjectForTrack<T extends Track> = (typeof SUBJECTS)[T][number];
