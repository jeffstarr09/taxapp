// Blog post data — edit this file to add new posts.
// Each post is rendered with its own metadata and JSON-LD article schema.

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string; // ISO date
  readingTime: number; // minutes
  keywords: string[];
  // Content is an array of sections — each section has a heading and paragraphs.
  // Simple structure keeps posts easy to author without a CMS or MDX.
  content: BlogSection[];
}

export interface BlogSection {
  heading?: string;
  paragraphs: string[];
  list?: { ordered?: boolean; items: string[] };
}

const posts: BlogPost[] = [
  {
    slug: "how-to-do-a-perfect-pushup",
    title: "How to Do a Perfect Pushup: Complete Form Guide",
    description:
      "Learn proper pushup form step-by-step. Avoid common mistakes, activate the right muscles, and build strength faster with this complete guide.",
    publishedAt: "2026-04-01",
    readingTime: 6,
    keywords: [
      "how to do a pushup",
      "pushup form",
      "proper pushup technique",
      "pushup guide",
      "push up form",
    ],
    content: [
      {
        paragraphs: [
          "The pushup is one of the most effective bodyweight exercises ever invented. It works your chest, shoulders, triceps, and core all at once — no equipment needed. But most people do them wrong, which limits results and can even lead to injury.",
          "This guide breaks down exactly how to do a perfect pushup, with the form cues that matter most. Whether you're a beginner or trying to fix a stubborn plateau, start here.",
        ],
      },
      {
        heading: "The Setup",
        paragraphs: [
          "Start in a high plank position with your hands placed slightly wider than shoulder-width apart. Your fingers should point forward, and your palms should be flat on the floor.",
          "Your body should form a straight line from your head to your heels. Engage your core and squeeze your glutes — this prevents your hips from sagging or piking up.",
        ],
      },
      {
        heading: "The Descent",
        paragraphs: [
          "Lower your body in a controlled motion. Aim for about 2 seconds on the way down. Your elbows should bend at roughly a 45-degree angle to your torso — not flared out to 90 degrees, which stresses the shoulder joint.",
          "Keep your gaze slightly ahead of you to maintain a neutral neck. Lower until your chest is about an inch off the ground, or until your upper arms are parallel to the floor.",
        ],
      },
      {
        heading: "The Push",
        paragraphs: [
          "Drive through your palms and push the ground away from you. Fully extend your arms at the top without locking your elbows. This is one complete rep.",
          "Don't rush. Quality beats quantity every time — five perfect pushups build more strength than twenty sloppy ones.",
        ],
      },
      {
        heading: "Common Mistakes to Avoid",
        paragraphs: [
          "These are the biggest form breakdowns we see:",
        ],
        list: {
          items: [
            "Sagging hips — engage your core and squeeze your glutes to keep your body in a straight line",
            "Flared elbows — keep them at about 45 degrees, not straight out sideways",
            "Half-reps — go all the way down, chest to floor",
            "Head dropping — keep your neck neutral, eyes looking slightly ahead",
            "Holding your breath — exhale as you push up, inhale as you lower",
          ],
        },
      },
      {
        heading: "How DROP Helps",
        paragraphs: [
          "Checking your own form is hard — you can't see yourself while you're doing pushups. DROP uses your phone camera and AI pose detection to count every rep and analyze your form in real time. If your hips start sagging or you're not going deep enough, you'll know immediately.",
          "It's free to try and works in your browser on any phone.",
        ],
      },
    ],
  },
  {
    slug: "how-many-pushups-per-day",
    title: "How Many Pushups Should You Do Per Day?",
    description:
      "The honest answer to how many pushups you should do per day, based on your goals. Beginner, intermediate, and advanced benchmarks included.",
    publishedAt: "2026-04-02",
    readingTime: 5,
    keywords: [
      "how many pushups a day",
      "pushups per day",
      "daily pushup routine",
      "pushup benchmarks",
    ],
    content: [
      {
        paragraphs: [
          "The right number of pushups per day depends on your goals, your current fitness level, and how well you recover. There's no magic universal number — but there are clear benchmarks that work for most people.",
          "Here's how to figure out what makes sense for you.",
        ],
      },
      {
        heading: "For Beginners: 20–50 Per Day",
        paragraphs: [
          "If you're just starting out, 20 to 50 quality pushups per day is plenty. Break them into sets of 5 to 10 and focus entirely on form. Your muscles and joints need time to adapt to the stress.",
          "It's better to do 3 sets of 10 perfect pushups than to rush through 30 sloppy ones. You'll build strength faster and avoid the injuries that sideline most beginners.",
        ],
      },
      {
        heading: "For Intermediate: 50–100 Per Day",
        paragraphs: [
          "Once you can do 15 to 20 strict pushups in a row, you're ready for higher volume. Aim for 50 to 100 per day, split across multiple sets throughout the day or within a single workout.",
          "This is also when you should start varying your pushup style — diamond, wide-grip, and decline variations all hit slightly different muscles.",
        ],
      },
      {
        heading: "For Advanced: 100–200+ Per Day",
        paragraphs: [
          "If you can do 30+ strict pushups in a row, your goal is likely more muscle endurance or hypertrophy. 100 to 200 pushups per day is achievable, but you need to prioritize recovery.",
          "At this level, consider adding weighted pushups (with a backpack or weight vest) for continued progression. Straight bodyweight alone stops being challenging.",
        ],
      },
      {
        heading: "Should You Really Do Them Every Day?",
        paragraphs: [
          "Honestly, no — at least not heavy sets. Your muscles need recovery time to grow. Doing 100 pushups daily is fine if the volume is split up and you're not going to failure every time.",
          "A smarter approach is to alternate hard days with lighter days. For example: Monday hard, Tuesday easy, Wednesday hard, Thursday rest. This builds strength faster than max volume every day.",
        ],
      },
      {
        heading: "Track Your Progress",
        paragraphs: [
          "Without tracking, you won't know if you're actually getting stronger. DROP automatically counts and logs every pushup you do, so you can see your progress over time — no spreadsheets, no guessing.",
        ],
      },
    ],
  },
  {
    slug: "30-day-pushup-challenge",
    title: "The 30-Day Pushup Challenge (With Daily Targets)",
    description:
      "A realistic 30-day pushup challenge with progressive daily targets. Build strength, endurance, and a habit in one month — no equipment required.",
    publishedAt: "2026-04-03",
    readingTime: 7,
    keywords: [
      "30 day pushup challenge",
      "pushup challenge",
      "monthly pushup plan",
      "beginner pushup program",
    ],
    content: [
      {
        paragraphs: [
          "A 30-day pushup challenge is one of the best ways to build strength, form a workout habit, and see measurable progress — all without any equipment.",
          "This plan starts easy and ramps up gradually. Rest days are built in because recovery is when your muscles actually grow. Follow it consistently and you'll be amazed at how much stronger you feel in a month.",
        ],
      },
      {
        heading: "Week 1: Build the Habit",
        paragraphs: [
          "The goal this week is consistency, not volume. Focus on perfect form every rep.",
        ],
        list: {
          ordered: true,
          items: [
            "Day 1: 10 pushups",
            "Day 2: 12 pushups",
            "Day 3: 15 pushups",
            "Day 4: Rest",
            "Day 5: 18 pushups",
            "Day 6: 20 pushups",
            "Day 7: Rest",
          ],
        },
      },
      {
        heading: "Week 2: Increase Volume",
        paragraphs: [
          "Now that you've built the habit, start pushing higher numbers. Break them into multiple sets if you need to.",
        ],
        list: {
          ordered: true,
          items: [
            "Day 8: 25 pushups",
            "Day 9: 30 pushups",
            "Day 10: 35 pushups",
            "Day 11: Rest",
            "Day 12: 40 pushups",
            "Day 13: 45 pushups",
            "Day 14: Rest",
          ],
        },
      },
      {
        heading: "Week 3: Push Harder",
        paragraphs: [
          "This is where it starts getting tough. Keep resting when the plan says — pushing through every rest day will slow your progress, not speed it up.",
        ],
        list: {
          ordered: true,
          items: [
            "Day 15: 50 pushups",
            "Day 16: 55 pushups",
            "Day 17: 60 pushups",
            "Day 18: Rest",
            "Day 19: 65 pushups",
            "Day 20: 70 pushups",
            "Day 21: Rest",
          ],
        },
      },
      {
        heading: "Week 4: Finish Strong",
        paragraphs: [
          "Final stretch. By now you should feel noticeably stronger. The last day is a max test — do as many as you can in one set.",
        ],
        list: {
          ordered: true,
          items: [
            "Day 22: 75 pushups",
            "Day 23: 80 pushups",
            "Day 24: 85 pushups",
            "Day 25: Rest",
            "Day 26: 90 pushups",
            "Day 27: 100 pushups",
            "Day 28: Rest",
            "Day 29: 100 pushups",
            "Day 30: Max pushups in one set",
          ],
        },
      },
      {
        heading: "How to Track It",
        paragraphs: [
          "Counting pushups manually gets tedious fast. DROP uses AI to automatically count every rep for you and logs your workouts so you can see your progress across the full 30 days. Start the challenge free — no download required.",
        ],
      },
    ],
  },
  {
    slug: "pushup-benefits",
    title: "10 Benefits of Doing Pushups Every Day",
    description:
      "Pushups do more than build your chest. Here's what actually happens to your body when you make pushups a daily habit — backed by exercise science.",
    publishedAt: "2026-04-04",
    readingTime: 5,
    keywords: [
      "pushup benefits",
      "benefits of pushups",
      "what pushups do for your body",
      "pushups every day",
    ],
    content: [
      {
        paragraphs: [
          "Pushups are deceptively simple. No equipment, no gym, no excuses — just you and the floor. But the benefits go far beyond building bigger arms.",
          "Here's what happens to your body when pushups become a regular habit.",
        ],
      },
      {
        heading: "1. Full Upper-Body Strength",
        paragraphs: [
          "Pushups simultaneously work your chest, shoulders, triceps, and core. Few exercises hit so many muscles at once with so little setup.",
        ],
      },
      {
        heading: "2. Core Stability",
        paragraphs: [
          "Holding a plank position for every rep trains your abs, obliques, and lower back to stabilize your spine. A strong core protects your back and improves every other exercise you do.",
        ],
      },
      {
        heading: "3. Better Posture",
        paragraphs: [
          "Pushups strengthen the muscles that hold your shoulders back and your spine aligned. If you sit at a desk all day, this is one of the fastest ways to counteract hunching.",
        ],
      },
      {
        heading: "4. Joint-Friendly Strength Training",
        paragraphs: [
          "Unlike heavy bench pressing, pushups let your shoulder blades move naturally. This reduces the risk of shoulder impingement and other overuse injuries common in gym lifters.",
        ],
      },
      {
        heading: "5. Functional Fitness",
        paragraphs: [
          "Pushups mirror real-world pushing motions — getting up off the floor, shoving a heavy door, catching yourself in a fall. The strength translates directly to everyday life.",
        ],
      },
      {
        heading: "6. Cardiovascular Benefit",
        paragraphs: [
          "High-rep pushups elevate your heart rate. Done in sets with minimal rest, they become a surprisingly effective cardio workout.",
        ],
      },
      {
        heading: "7. Scales With You Forever",
        paragraphs: [
          "Pushups can be made easier (knee pushups, incline pushups) or harder (decline, diamond, one-arm, weighted). There's always a harder variation to progress to.",
        ],
      },
      {
        heading: "8. Mental Discipline",
        paragraphs: [
          "A daily pushup habit builds the mental muscle of showing up. Even on bad days, a set of pushups takes less than a minute — no excuses.",
        ],
      },
      {
        heading: "9. No Equipment, No Gym Fees",
        paragraphs: [
          "You can do pushups anywhere — hotel rooms, living rooms, parking lots. The best workout is the one you'll actually do.",
        ],
      },
      {
        heading: "10. Measurable Progress",
        paragraphs: [
          "Pushups are easy to track. More reps, better form, harder variations — progress is obvious and motivating. Apps like DROP automate the tracking so you can focus on the work.",
        ],
      },
    ],
  },
  {
    slug: "pushup-variations",
    title: "15 Pushup Variations From Easy to Hardest",
    description:
      "A progression guide of 15 pushup variations, ranked from beginner to advanced. Find your level and get stronger with bodyweight training only.",
    publishedAt: "2026-04-05",
    readingTime: 6,
    keywords: [
      "pushup variations",
      "types of pushups",
      "pushup progression",
      "hard pushup variations",
    ],
    content: [
      {
        paragraphs: [
          "Regular pushups are just the starting line. There are dozens of variations that target different muscles and add difficulty without needing any equipment.",
          "Here's a progression from the easiest to the hardest. Start where you can do 10 clean reps, then work your way up.",
        ],
      },
      {
        heading: "Beginner",
        paragraphs: [
          "Start here if you can't do a strict standard pushup yet.",
        ],
        list: {
          ordered: true,
          items: [
            "Wall pushups — stand facing a wall, hands on wall, lean in and push back out",
            "Incline pushups — hands on a bench or table, feet on the floor",
            "Knee pushups — standard form but with knees on the ground",
          ],
        },
      },
      {
        heading: "Intermediate",
        paragraphs: [
          "You can do 10+ standard pushups with good form.",
        ],
        list: {
          ordered: true,
          items: [
            "Standard pushup — the benchmark",
            "Wide-grip pushup — hands further apart, more chest activation",
            "Diamond pushup — hands together in a diamond shape, hits triceps",
            "Staggered pushup — one hand forward, one back",
            "Decline pushup — feet elevated on a bench or step",
          ],
        },
      },
      {
        heading: "Advanced",
        paragraphs: [
          "You can do 25+ standard pushups and need a new challenge.",
        ],
        list: {
          ordered: true,
          items: [
            "Archer pushup — shift weight to one side as you descend",
            "Explosive pushup — push up hard enough that your hands leave the floor",
            "Clapping pushup — add a clap at the top of each rep",
            "Pseudo planche pushup — hands near your hips, shoulders forward",
            "Pike pushup — hips high, pushing toward a handstand position",
          ],
        },
      },
      {
        heading: "Elite",
        paragraphs: [
          "These take serious training — months or years of consistent practice.",
        ],
        list: {
          ordered: true,
          items: [
            "One-arm pushup — true test of unilateral upper body strength",
            "Handstand pushup — vertical pushup against a wall",
          ],
        },
      },
      {
        heading: "Track Every Variation",
        paragraphs: [
          "DROP counts standard pushups with AI accuracy. Log every rep, across every variation, and watch your progress build over time. Free to try in your browser.",
        ],
      },
    ],
  },
];

export function getAllBlogPosts(): BlogPost[] {
  return [...posts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
