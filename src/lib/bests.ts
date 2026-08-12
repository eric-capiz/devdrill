import { connectDB } from "@/lib/db";
import { QuizAttempt } from "@/models/QuizAttempt";
import { User } from "@/models/User";

export type FixedBest = {
  subject: string;
  track: string;
  level: string;
  scorePercent: number;
  gradedAt: Date;
  username?: string;
};

export type UnlimitedBest = {
  subject: string;
  track: string;
  level: string;
  points: number;
  gradedAt: Date;
  username?: string;
};

type PopulatedUser = { username: string };

function usernameFrom(userId: unknown) {
  if (userId && typeof userId === "object" && "username" in userId) {
    return (userId as PopulatedUser).username;
  }
  return undefined;
}

export async function getGlobalBests() {
  await connectDB();
  void User;

  const [topFixedDoc, topUnlimitedDoc] = await Promise.all([
    QuizAttempt.findOne({
      status: "graded",
      mode: "fixed",
      scorePercent: { $ne: null },
    })
      .sort({ scorePercent: -1, gradedAt: -1 })
      .populate("userId", "username")
      .lean(),
    QuizAttempt.findOne({
      status: "graded",
      mode: "unlimited",
      points: { $ne: null },
    })
      .sort({ points: -1, gradedAt: -1 })
      .populate("userId", "username")
      .lean(),
  ]);

  const topFixed: FixedBest | null = topFixedDoc
    ? {
        subject: topFixedDoc.subject,
        track: topFixedDoc.track,
        level: topFixedDoc.level,
        scorePercent: topFixedDoc.scorePercent as number,
        gradedAt: topFixedDoc.gradedAt ?? topFixedDoc.createdAt,
        username: usernameFrom(topFixedDoc.userId),
      }
    : null;

  const topUnlimited: UnlimitedBest | null = topUnlimitedDoc
    ? {
        subject: topUnlimitedDoc.subject,
        track: topUnlimitedDoc.track,
        level: topUnlimitedDoc.level,
        points: topUnlimitedDoc.points as number,
        gradedAt: topUnlimitedDoc.gradedAt ?? topUnlimitedDoc.createdAt,
        username: usernameFrom(topUnlimitedDoc.userId),
      }
    : null;

  return { topFixed, topUnlimited };
}

export async function getUserBests(userId: string) {
  await connectDB();

  const graded = await QuizAttempt.find({
    userId,
    status: "graded",
  })
    .sort({ gradedAt: -1 })
    .lean();

  const fixedBySubject = new Map<string, FixedBest>();
  const unlimitedBySubject = new Map<string, UnlimitedBest>();

  for (const q of graded) {
    const key = `${q.track}::${q.subject}`;
    if (q.mode === "fixed" && typeof q.scorePercent === "number") {
      const existing = fixedBySubject.get(key);
      if (
        !existing ||
        q.scorePercent > existing.scorePercent ||
        (q.scorePercent === existing.scorePercent &&
          (q.gradedAt ?? q.createdAt) > existing.gradedAt)
      ) {
        fixedBySubject.set(key, {
          subject: q.subject,
          track: q.track,
          level: q.level,
          scorePercent: q.scorePercent,
          gradedAt: q.gradedAt ?? q.createdAt,
        });
      }
    }
    if (q.mode === "unlimited" && typeof q.points === "number") {
      const existing = unlimitedBySubject.get(key);
      if (
        !existing ||
        q.points > existing.points ||
        (q.points === existing.points &&
          (q.gradedAt ?? q.createdAt) > existing.gradedAt)
      ) {
        unlimitedBySubject.set(key, {
          subject: q.subject,
          track: q.track,
          level: q.level,
          points: q.points,
          gradedAt: q.gradedAt ?? q.createdAt,
        });
      }
    }
  }

  const fixedBests = [...fixedBySubject.values()].sort(
    (a, b) => b.scorePercent - a.scorePercent,
  );
  const unlimitedBests = [...unlimitedBySubject.values()].sort(
    (a, b) => b.points - a.points,
  );

  return { fixedBests, unlimitedBests };
}

export async function getUserHistory(userId: string) {
  await connectDB();
  return QuizAttempt.find({ userId, status: "graded" })
    .sort({ gradedAt: -1 })
    .limit(50)
    .lean();
}
