import getAssetUrl from '../utils/assets/assetUrl';

/**
 * CodeGrind native blog posts (in-house, prerendered, owned by codegrind.online).
 *
 * Each post is a JS object with the shape documented below. Posts are added
 * to the NATIVE_BLOG_POSTS array. Routes are registered automatically in
 * App.jsx via the path `/blog/codegrind/:slug`. Prerendered blog routes are
 * derived from the published posts returned by getPublishedNativeBlogPosts().
 * The MobileAccessGuard allowlist permits `/blog/codegrind/:slug` so these
 * pages render on mobile.
 *
 * Post shape:
 * {
 *   slug: string,                        // URL slug, e.g. 'how-tower-defense-teaches-dsa'
 *   title: string,                       // page <title> and <h1>
 *   description: string,                 // meta description (155-160 chars ideal)
 *   keywords: string,                    // comma-separated meta keywords
 *   publishedAt: 'YYYY-MM-DD',
 *   updatedAt: 'YYYY-MM-DD',
 *   author: { name: string, url?: string },
 *   heroImage?: string,                  // environment-aware local/blob image URL
 *   eyebrow?: string,                    // small label above the title
 *   intro: string,                       // lede paragraph rendered under the title
 *   sections: Array<{
 *     heading: string,
 *     paragraphs: string[],              // each entry rendered as a <p>
 *     bullets?: string[],                // optional unordered list
 *   }>,
 *   faqs?: Array<{ question, answer }>,  // optional FAQ block (also emits FAQPage JSON-LD)
 *   relatedPages?: Array<{ label, path }>,
 *   draft?: boolean,                     // when true, post is excluded from listing/routes
 * }
 */

const LOCAL_NATIVE_BLOG_IMAGE_BASE_PATH = '/blog';
const PROD_NATIVE_BLOG_IMAGE_BASE_PATH = '/images/native_blogs';
const VITE_ENV = import.meta.env || {};

export const getNativeBlogHeroImage = (fileName) => {
  if (!fileName) return undefined;

  if (VITE_ENV.PROD || VITE_ENV.VITE_ASSET_BASE_URL) {
    return getAssetUrl(`${PROD_NATIVE_BLOG_IMAGE_BASE_PATH}/${fileName}`);
  }

  return `${LOCAL_NATIVE_BLOG_IMAGE_BASE_PATH}/${fileName}`;
};

export const getNativeBlogVideo = (fileName) => {
  if (!fileName) return undefined;

  if (VITE_ENV.PROD || VITE_ENV.VITE_ASSET_BASE_URL) {
    return getAssetUrl(`${PROD_NATIVE_BLOG_IMAGE_BASE_PATH}/${fileName}`);
  }

  return `${LOCAL_NATIVE_BLOG_IMAGE_BASE_PATH}/${fileName}`;
};

export const NATIVE_BLOG_POSTS = [
  {
    slug: 'tower-defense-teaches-dsa-patterns',
    title: 'How Code Breach on CodeGrind Teaches DSA Patterns',
    description:
      'Code Breach, the first live featured game on CodeGrind, turns DSA practice into tower defense rounds where the code you write is the gameplay. Here is how that loop teaches patterns.',
    keywords:
      'tower defense coding, gamified dsa practice, code breach codegrind, learn dsa patterns, coding game for interview prep',
    publishedAt: '2026-04-28',
    updatedAt: '2026-04-28',
    author: { name: 'CodeGrind Team' },
    heroImage: getNativeBlogHeroImage('tower-defense-teaches-dsa-patterns.jpg'),
    eyebrow: 'GAMEPLAY',
    intro:
      'Most people who try to grind data structures and algorithms quit somewhere in the second or third week. The problems are not too hard. The format is just exhausting. Code Breach, the first live featured game on CodeGrind, is our attempt to keep the same problems and the same skills, but wrap them in a tower defense shape that gives every session a clear start, a visible middle, and a satisfying end.',
    sections: [
      {
        heading: 'The boring truth about how most people study DSA',
        paragraphs: [
          'A typical DSA practice plan looks like this. Open a problem list. Pick something tagged with the topic you are weakest at. Read the prompt. Write a solution. Move to the next one. Repeat for an hour. The work is real, the skill builds slowly, and almost everyone burns out before they get to the patterns that actually show up in interviews.',
          'The reason it burns out has very little to do with the difficulty of the problems. It is the lack of shape. There is no end of round. There is no visible progress within a session. There is just a long list of problems and a vague sense that you should keep solving them. That format is fine for a small number of disciplined people. For most learners it just does not survive a long week.',
        ],
      },
      {
        heading: 'What Code Breach actually is',
        paragraphs: [
          'Code Breach is a tower defense mode built directly on top of the CodeGrind problem library. You queue into a mission. A path appears. Waves of enemies start moving. To clear a wave, you have to pass the hidden test cases on a coding problem that is shown next to the game. The harder the problem, the longer the wave gets to move before you stop it. The better your code, the more breathing room you get for the next wave.',
          'The important part is that the gameplay is not a layer on top of a quiz. It runs against the same execution backend, the same hidden tests, and the same judge as our standard problem workspace. Solving a problem in a Code Breach round is the same as solving it from the problem list. The only thing the game adds is shape and stakes.',
        ],
      },
      {
        heading: 'Why one tower defense round is a good shape for one DSA problem',
        paragraphs: [
          'A round of Code Breach takes a focused, contained chunk of time. You sit down, you look at one problem, you iterate on it, and either you clear the round or you do not. There is a beginning and an end. That alone is a big improvement over an open-ended problem list, because the brain treats finishable tasks differently from infinite ones.',
          'Inside the round, the wave timer makes the iteration loop feel real. When your first attempt fails, you can see the test case it failed on, fix the code, and resubmit while the next wave is still moving. The pressure is light, but it is enough to push you through the part of the problem where most learners would normally tab away to social media for ten minutes and lose the thread.',
        ],
      },
      {
        heading: 'The pattern catalog underneath the missions',
        paragraphs: [
          'Each mission pulls from a specific cluster of problems built around one DSA pattern. Sliding window. Two pointers. Hash map lookup. Stack-based parsing. Recursion and memoization. Graph traversal. Binary search variants. Dynamic programming on intervals. The catalog covers the standard interview patterns, and the cluster groupings are what actually teach the patterns over time, not the individual problems.',
          'The way the patterns get into your head is the same way they get into anyone else who has ground them out before. You see a problem that smells like sliding window. You try a different approach. It does not work. You think about it for a minute and try sliding window. It works. You see another one that smells the same. The recognition gets faster. After ten or twenty problems on one pattern, you stop having to think about whether to use it.',
          'Code Breach makes you do that ten-or-twenty-problem grind without it feeling like a grind, because each one is also a tower defense round.',
        ],
      },
      {
        heading: 'When to play vs when to grind',
        paragraphs: [
          'Code Breach is not the only practice mode on CodeGrind, and it should not be. The standard problem workspace, the cluster pages, and the language paths all exist for a reason. The right way to use the game mode is as the practice surface for days when you do not feel like opening a problem list. On those days, a tower defense mission is a smaller commitment, and you will usually do more meaningful work in twenty minutes of play than you would in twenty minutes of trying to talk yourself into a focused session.',
          'On days when you are already locked in, the standard workspace is faster and quieter. You can run through a cluster, take notes, study patterns, and build up the kind of focused understanding that a game round is not really designed to give you. The platform is built so both modes are right there, and switching between them does not lose any progress.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Are the problems in Code Breach the same as on regular coding sites?',
        answer:
          'They are the same kind of problem and the same kind of skills. The catalog covers the standard DSA patterns interviewers ask about. The difference is the framing, not the underlying material.',
      },
      {
        question: 'Can I learn DSA from a tower defense game?',
        answer:
          'You can learn DSA from any practice format that asks you to write real code against real test cases often enough. Code Breach qualifies, because the gameplay literally runs your code through hidden tests. The game part helps you keep showing up, which is the part that breaks for most learners.',
      },
      {
        question: 'How long does a Code Breach round take?',
        answer:
          'A typical round takes around fifteen to thirty minutes depending on how quickly you solve the problem. That makes it a good fit for one evening session.',
      },
    ],
    relatedPages: [
      { label: 'Tower defense coding game', path: '/tower-defense-coding-game' },
      { label: 'DSA practice gamified', path: '/dsa-practice-gamified' },
      { label: 'Gamified coding practice', path: '/gamified-coding-practice' },
      { label: 'Coding interview prep game', path: '/coding-interview-prep-game' },
      { label: 'Browse problems', path: '/problems' },
    ],
  },
  {
    slug: 'python-beginner-first-month',
    title: 'From Zero to First Solve: A Python Beginner Walkthrough on CodeGrind',
    description:
      'A grounded, week-by-week walkthrough of what a Python beginner can realistically do on CodeGrind in their first month, from the language path to a first cleared Code Breach mission.',
    keywords:
      'python beginner coding, learn python from scratch, beginner coding practice, python coding practice for beginners, codegrind python path',
    publishedAt: '2026-04-28',
    updatedAt: '2026-04-28',
    author: { name: 'CodeGrind Team' },
    heroImage: getNativeBlogHeroImage('python-beginner-first-month.jpg'),
    eyebrow: 'LEARNING PATH',
    intro:
      'A lot of beginner programming guides describe a fantasy version of the first month, where the learner is somehow already comfortable with for loops by day three and is building a portfolio app by week four. The real first month for most people is slower, messier, and a lot more honest. Here is what a realistic month looks like on CodeGrind for someone starting from zero in Python.',
    sections: [
      {
        heading: 'Where most beginners actually stall',
        paragraphs: [
          'The hard part of the first month is not the syntax. The syntax is small. Variables, conditionals, loops, functions, lists, dictionaries. That is most of what you need to start solving real problems, and you can read the entire surface of it in an afternoon. The hard part is the gap between reading what a for loop does and being able to write one without looking it up.',
          'That gap closes through reps. Not through more reading, not through watching another video, just through writing small programs that fail, and then fixing them. The CodeGrind Python path is built around that loop. Every short lesson is followed by an editor task, and the task does not pass until your code actually works against the test cases.',
        ],
      },
      {
        heading: 'Week 1: The Python path',
        paragraphs: [
          'Week one is the language path. The first lessons cover variables, types, and printing. Then conditionals. Then loops. Then functions. By the end of the week, you have written maybe twenty short programs in the editor, all of which have failed at least once and been fixed. That is the part that matters. You have started to build the small habits that make programming possible. Read the prompt. Try something. Read the failure. Adjust.',
          'You will not feel fluent at the end of week one. Nobody does. What you should feel is that the editor is not scary, and that running code is normal.',
        ],
      },
      {
        heading: 'Week 2: First easy problems',
        paragraphs: [
          'Week two starts mixing in the easier problems from the main library. Things like reversing a string, finding a maximum, counting how many times a value shows up in a list. These are problems where the trick is small, but the work of writing the loop and the conditional and the return statement is the entire skill you need to keep building.',
          'A reasonable pace for week two is one or two of these problems a day. Some will take five minutes. Some will take an hour. Both are fine. The hour-long ones are usually the ones where you learn the most, because you spent forty-five minutes wrestling with one specific kind of mistake and you will not make that mistake the same way again.',
        ],
      },
      {
        heading: 'Week 3: Tower defense missions enter the picture',
        paragraphs: [
          'By week three, the demo Code Breach mission becomes a fair test. You can read the problem, write a first attempt, watch it fail, and iterate. The game format is helpful here because some days in week three will be the days where you are tired or busy or just not feeling it, and a tower defense round is a much smaller mental lift than opening a problem list and disciplining yourself into a focused session.',
          'Mix the missions in with regular problems. Two missions and one focused practice block per day is a strong week. One of either is still a real session. Zero is the only number that breaks the habit, and the platform is built specifically to keep you out of the zero column.',
        ],
      },
      {
        heading: 'Week 4: A real practice habit',
        paragraphs: [
          'By the end of week four, the goal is not to be an expert. The goal is for the loop of opening CodeGrind, writing some code, and closing the tab to feel like a normal part of your day. That habit is what carries you through the next three months, and the next three months are where the real progression happens. You start handling medium problems. You see a few patterns more than once. You finish your first cluster.',
          'The ones who get through that wall are almost never the ones with the most natural talent. They are the ones who built a sustainable loop in month one and then just stayed in it.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How much time per day do I need in the first month?',
        answer:
          'Thirty to sixty minutes is plenty for a beginner. The most important number is consistency, not session length. Five sessions of thirty minutes is far better than one session of three hours.',
      },
      {
        question: 'Do I need to know any coding before I start the Python path?',
        answer:
          'No. The Python path starts at the level of variables and printing. You do not need any prior programming experience.',
      },
      {
        question: 'Can I start with a different language?',
        answer:
          'Yes. CodeGrind has beginner paths for JavaScript, Java, and C++ as well. Python is the easiest entry point for most people, but any of them work as a starting language.',
      },
    ],
    relatedPages: [
      { label: 'Python coding practice', path: '/python-coding-practice' },
      { label: 'Beginner coding practice', path: '/beginner-coding-practice' },
      { label: 'Gamified code learning', path: '/gamified-code-learning' },
      { label: 'Learn to code with games', path: '/learn-to-code-with-games' },
      { label: 'Browse the learning paths', path: '/learning' },
    ],
  },
  {
    slug: 'hidden-test-cases-beat-copy-paste',
    title: 'Why Hidden Test Cases Beat Copy-Paste Solutions',
    description:
      'Public test cases plus public solutions equals fake practice. Here is why CodeGrind leans on hidden tests, and what that changes about how you actually learn.',
    keywords:
      'hidden test cases coding, coding interview practice, copy paste coding solutions, real coding practice, codegrind problem workspace',
    publishedAt: '2026-04-28',
    updatedAt: '2026-04-28',
    author: { name: 'CodeGrind Team' },
    heroImage: getNativeBlogHeroImage('hidden-test-cases-beat-copy-paste.jpg'),
    eyebrow: 'PRACTICE FORMAT',
    intro:
      "The most common failure mode in coding practice is not laziness. It is a pipeline that quietly trains a skill nobody is hiring for. When the test cases are public and the solutions are public, the easiest path to a green checkmark is reading someone else's code and pasting it in. CodeGrind leans hard on hidden tests because the alternative does not survive contact with a real interview.",
    sections: [
      {
        heading: 'The copy-paste trap',
        paragraphs: [
          'Most public coding practice sites have the same problem. The full set of test cases is right there in the editor. The official solution is two scrolls down on every popular discussion thread. The community comments are full of working code in five languages. If your goal is to make the green checkmark appear, the fastest path is almost never to think.',
          'That works for a while. You finish a lot of problems. The streak counter goes up. The progress bar fills in. Then you sit down for a real interview and the prompt is something you have not seen, the interviewer is watching you write the first line, and you realize you have been training the wrong muscle the whole time.',
        ],
      },
      {
        heading: 'What hidden tests actually do',
        paragraphs: [
          'A hidden test case is a unit test that you do not see the inputs for. You see the public examples in the prompt, you write code that you think handles the general case, and you submit. The hidden tests run, and they tell you how many passed and which categories failed. The ones that fail give you a hint, a small one, but they do not hand you the inputs.',
          'That tiny change reshapes the entire practice loop. Your first read of the problem has to actually be a read. You have to think about edge cases on your own. You have to ask yourself what a tricky input would look like, because the platform is going to test you on one and you will not get to peek. Every submission becomes a small bet, which is exactly what every interview submission is.',
        ],
      },
      {
        heading: 'Why this maps to real interviews',
        paragraphs: [
          'A coding interview is not a memory test. It is a thinking-out-loud test in which the interviewer wants to see how you handle a problem you do not already know the answer to. Hidden test cases approximate that environment as well as any practice surface can. You can guess. You can be wrong. You will get just enough feedback to adjust without being handed the answer.',
          'After enough hidden-test reps, your default approach to a new problem changes. You stop scanning for whether you have seen this exact prompt before, and you start asking yourself what the inputs look like, what the edges are, and what the smallest correct solution looks like. That is the actual interview skill, and it does not really build any other way.',
        ],
      },
      {
        heading: 'How CodeGrind structures its hidden tests',
        paragraphs: [
          'Each problem ships with a small set of public examples in the prompt and a much larger set of hidden tests behind the submit button. The hidden tests are organized by category. Basic correctness. Edge cases. Stress tests for performance. When you fail, you see which category failed and how many cases in it, but not the specific input. That is enough to point you in the right direction without removing the work.',
          'The same hidden test rig powers the standard problem workspace, the Code Breach tower defense mode, and the cluster sequences. Wherever you are practicing, the test pipeline is the same, and so is the training effect.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Are public test cases bad?',
        answer:
          'Public examples in the prompt are good. They show you what a valid input and output look like. The problem is when the entire test suite is public and copy-pasteable, because that lets you brute force a green checkmark without thinking.',
      },
      {
        question: 'What happens when I fail a hidden test?',
        answer:
          'You see which category of test failed and how many cases failed in it. You do not see the specific input. That is the point. The tiny gap between knowing your code is wrong and knowing exactly why is where the actual learning happens.',
      },
      {
        question: 'Can I see hidden test inputs anywhere?',
        answer:
          'No. Hidden tests stay hidden by design. A platform that leaks them is just a slower public test platform.',
      },
    ],
    relatedPages: [
      { label: 'Coding interview practice', path: '/coding-interview-practice' },
      { label: 'LeetCode alternatives', path: '/leetcode-alternatives' },
      { label: 'Coding interview prep game', path: '/coding-interview-prep-game' },
      { label: 'Browse problems', path: '/problems' },
    ],
  },
  {
    slug: 'leetcode-burnout-different-way',
    title: 'LeetCode Burnout: A Different Way to Keep Practicing',
    description:
      'Grinding LeetCode all weekend until you cannot stand to look at code on Monday is not a strategy. Here is a practice loop that actually survives a long week.',
    keywords:
      'leetcode burnout, leetcode alternative, sustainable coding practice, gamified leetcode, codegrind interview prep',
    publishedAt: '2026-04-28',
    updatedAt: '2026-04-28',
    author: { name: 'CodeGrind Team' },
    heroImage: getNativeBlogHeroImage('leetcode-burnout-different-way.jpg'),
    eyebrow: 'PRACTICE STRATEGY',
    intro:
      'The most common interview prep story is the same every cycle. Two weeks of intense daily grinding. One bad day where nothing clicks. A week off. A guilty restart. Another two weeks. Burnout again. Then the interview week shows up and the candidate is somewhere between rusty and exhausted. CodeGrind is built to break that cycle by making practice less brittle, not by making it more intense.',
    sections: [
      {
        heading: 'The burnout pattern',
        paragraphs: [
          'A typical LeetCode plan looks like a pyramid scheme of motivation. The candidate decides this is the week they get serious. They block off a Saturday, do six problems, feel great. They show up Monday after work, do two more, feel okay. Wednesday they do one and skip it halfway through. By Sunday they have not opened the site in three days and the streak is gone. The plan was good for one week and then it folded.',
          'The reason that plan folds has very little to do with discipline. It has to do with the shape of the work. A flat list of unrelated problems with no visible end of session is one of the worst possible structures for sustainable practice, and almost every prep grind defaults to it.',
        ],
      },
      {
        heading: 'Why traditional grinding fails',
        paragraphs: [
          'Three things break a flat problem grind. First, sessions have no shape. There is no clear stopping point, so a tired candidate either pushes through and burns out faster, or quits early and feels guilty. Second, related problems are not grouped, so the brain never gets the satisfying click of recognizing a pattern across three or four problems in a row. Third, the entire feedback loop is binary. Pass or fail, with very little structure between them.',
          'You can fight all three with willpower for a few weeks. Then real life happens. A bad day at work. A weekend with family. A week of sleep deprivation. The grind that depended entirely on motivation does not survive any of those, and the candidate ends up in the burnout-and-restart loop instead of in a steady practice habit.',
        ],
      },
      {
        heading: 'How clusters and missions change the loop',
        paragraphs: [
          'CodeGrind tries to fix the shape problem in two ways. The cluster system groups problems by pattern, so a session has a topic instead of being a random walk. You see four sliding window problems in a row, and the pattern starts to settle into your head in a way that one isolated sliding window problem in the middle of a flat list never quite manages.',
          'The Code Breach tower defense mode fixes the session-shape problem. A round has a beginning and an end. You queue, you solve a problem, the round resolves, you can stop or queue another. On a day when you are tired, one round is a real session. On a day when you are focused, three rounds is a real session. Both feel finished, and finished sessions are the ones you come back to tomorrow.',
        ],
      },
      {
        heading: 'A sustainable weekly plan',
        paragraphs: [
          'A practice week that actually survives a long month looks something like this. Monday and Tuesday, one cluster session focused on a specific pattern. Wednesday, a Code Breach round if you have energy, or skip. Thursday, another cluster session on the same pattern to lock it in. Friday, one mock-style problem from a fresh pattern. Weekend, one longer session if you want it, or rest if you do not.',
          'That is not an aggressive plan. That is the point. The candidate who runs a plan like that for three months will be in dramatically better shape for an interview than the one who ran a six-hour Saturday for two weekends and then disappeared. Slow and consistent beats fast and brittle every single cycle.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is CodeGrind a replacement for LeetCode?',
        answer:
          'CodeGrind covers the same skills and the same patterns interviewers ask about, with a different practice format that more people seem to be able to sustain. Some learners use it as a full replacement. Others use it alongside LeetCode for the days when they cannot face a flat problem list.',
      },
      {
        question: 'How long should a practice session be?',
        answer:
          'Twenty to forty-five minutes is a reasonable target for most people most days. Longer sessions are fine when you have the energy. Shorter sessions still count. A consistent half hour beats an inconsistent two hours by a wide margin.',
      },
      {
        question: 'What if I am already burned out?',
        answer:
          'Take a few days off entirely, then come back with one short Code Breach round. Not a full study session. Just one round. That is the lowest-friction way to get the habit moving again, and it is what the game format is partly designed for.',
      },
    ],
    relatedPages: [
      { label: 'LeetCode alternatives', path: '/leetcode-alternatives' },
      { label: 'Gamified coding practice', path: '/gamified-coding-practice' },
      { label: 'Coding interview practice', path: '/coding-interview-practice' },
      { label: 'DSA practice gamified', path: '/dsa-practice-gamified' },
      { label: 'Browse problems', path: '/problems' },
    ],
  },
  {
    slug: 'codegrind-is-free-what-you-pay-for',
    title: 'CodeGrind Is Free. Here Is What You Actually Pay For',
    description:
      'Every problem, every lesson, every cluster, and every Code Breach mission on CodeGrind is free. Paid tiers raise AI limits, unlock more models, cut ads, and add beta access.',
    keywords:
      'free coding practice, free leetcode alternative, codegrind pricing, free coding interview prep, gamified coding free, codegrind free tier',
    publishedAt: '2026-04-29',
    updatedAt: '2026-04-29',
    author: { name: 'CodeGrind Team' },
    heroImage: getNativeBlogHeroImage('codegrind-is-free-what-you-pay-for.jpg'),
    eyebrow: 'PLATFORM',
    intro:
      'A lot of coding sites say they are free and then quietly put the good problems, the cleanest editor, or the only useful study path behind a subscription. CodeGrind does not work that way. Every problem, every lesson, every cluster, every Code Breach mission, and every learning path is available on the free tier. The paid tiers exist for people who want more AI usage, more model choice, fewer ads, and earlier access to new features. The content itself is never gated.',
    sections: [
      {
        heading: 'What free actually means here',
        paragraphs: [
          'When we say the free tier has full access to the content, we mean it in the boring, literal sense. The problem library is not split into a free section and a paid section. The Python, JavaScript, Java, and C++ learning paths are all open. The cluster sequences for every DSA pattern are open. The Code Breach tower defense missions are open. The hidden test cases run for free users on the same backend that runs them for everyone else.',
          'A free user can show up tomorrow, never spend a cent, and still grind through the entire interview prep curriculum, finish every learning path, and clear every tower defense mission. That is not a marketing line. That is the structural design of the platform.',
        ],
      },
      {
        heading: 'What the paid tiers actually unlock',
        paragraphs: [
          'The paid tiers exist because some pieces of the platform have real per-user costs that scale with usage. AI hints and AI explanations are the obvious one. Every AI call costs us money, and a free tier with unlimited AI usage would not survive contact with reality. So the free tier comes with a fair daily allowance, and the paid tiers raise that allowance.',
          'Beyond the limits, paid tiers also unlock more model choices. Free users get a solid default model. Paid users can pick from a roster that includes faster models, smarter models, and specialized models for things like step-by-step explanation versus quick hints. Different problems benefit from different models, and a paid plan gives you the ability to choose.',
        ],
        bullets: [
          'Higher daily and monthly AI usage limits',
          'Access to a wider roster of AI models for hints and explanations',
          'Reduced or zero ad load across the site',
          'Early beta access to new features before they hit the free tier',
          'Priority queue placement for code execution during peak hours',
        ],
      },
      {
        heading: 'Why we did it this way',
        paragraphs: [
          'The honest reason is that gating educational content makes the platform worse. A learner who hits a paywall on problem fifty of a learning path does not pay. They leave. The lessons stop, the practice stops, and a person who could have become a real engineer goes back to whatever else they were doing. That is bad for the learner and bad for the platform.',
          'Gating consumable resources is different. AI calls cost real money. Server time costs real money. Hosting more content for more users costs real money. The paid tiers fund the parts of the platform that have real marginal cost, and they keep the educational content open for the people who cannot or do not want to pay.',
          'There is also a self-interested angle. People who learn for free on CodeGrind for six months and decide they want to upgrade for more AI access tend to be much happier customers than people who paid on day one because a paywall blocked them. The free tier is the trial, and the trial is the real product.',
        ],
      },
      {
        heading: 'How to get the most out of the free tier',
        paragraphs: [
          'Use the AI allowance carefully on hard problems instead of burning it on easy ones. Run the daily Code Breach round, which is the lowest-friction way to keep a practice habit alive. Work through one cluster at a time so the patterns settle in. Treat the learning paths as the spine of your study and use the problem library as the gym. None of that requires a paid plan, and none of it ever will.',
          'When you do hit the AI limit and decide you want more, that is the moment a paid plan starts paying for itself. Until then, the free tier is genuinely the whole platform.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is the free tier just a trial?',
        answer:
          'No. The free tier is permanent. You can stay on it forever. Every problem, lesson, cluster, learning path, and tower defense level is available without paying, and that is not going to change.',
      },
      {
        question: 'What gets locked behind a paid plan?',
        answer:
          'No content gets locked. What changes on paid plans is the size of your daily AI usage allowance, the roster of AI models you can pick from, the amount of ad inventory you see, and your access to features still in beta.',
      },
      {
        question: 'Will the free tier shrink later if the platform grows?',
        answer:
          'The free tier will not shrink in a way that gates content. Free users will always have full access to every problem, lesson, learning path, and game mode. Per-user limits on AI usage are calibrated to keep the platform sustainable as it grows, and any future changes there get communicated clearly in advance.',
      },
      {
        question: 'Why charge for AI access at all?',
        answer:
          'Each AI call costs real money. A free tier with unlimited AI usage would either bankrupt the platform or force us to gate content to fund it. The paid tiers fund the AI infrastructure so the educational content can stay open.',
      },
    ],
    relatedPages: [
      { label: 'About CodeGrind', path: '/about' },
      { label: 'Gamified coding practice', path: '/gamified-coding-practice' },
      { label: 'Beginner coding practice', path: '/beginner-coding-practice' },
      { label: 'LeetCode alternatives', path: '/leetcode-alternatives' },
      { label: 'Coding interview practice', path: '/coding-interview-practice' },
    ],
  },
  {
    slug: 'why-codegrind-added-a-shop',
    title: 'Why CodeGrind Added a Shop Without Turning Practice Into a Paywall',
    description:
      'CodeGrind now has a shop, but it is built as a progression and personalization surface around play, not a paywall around learning or core coding practice.',
    keywords:
      'codegrind shop, coding game cosmetics, packet bazaar codegrind, codegrind store, gamified coding platform updates',
    publishedAt: '2026-05-14',
    updatedAt: '2026-05-14',
    author: { name: 'CodeGrind Team' },
    heroImage: getNativeBlogHeroImage('Shop_NativeBlog_Image.png'),
    eyebrow: 'STORE',
    intro:
      'A lot of learning platforms add a shop the lazy way. They build the core loop, then months later they bolt on a catalog that exists mostly to interrupt the core loop. We did not want that. The new CodeGrind shop exists because the platform now has enough surfaces worth customizing: the editor, the tower defense board, and the profile layer that sits around long-term progression. The point is not to make learning more expensive. The point is to give active users a place to shape the version of CodeGrind they spend time in every day.',
    sections: [
      {
        heading: 'Why a shop makes sense on this platform now',
        paragraphs: [
          'CodeGrind is no longer just a problem list with a game attached. There is a homepage demo shell, a full tower defense mode, guided learning paths, public profiles, and now a city layer that treats different product surfaces like places instead of tabs. Once the platform starts feeling like a world instead of a worksheet, customization stops feeling ornamental and starts feeling native.',
          'That is the real reason the shop exists. It gives players a progression surface for the parts of the experience they actually stare at while practicing: editor themes and fonts, tower defense board and effect packs, and profile presentation upgrades. Those are the kinds of choices that make repeated practice feel more personal without changing the fact that the real work is still solving problems.',
        ],
      },
      {
        heading: 'What the store actually includes',
        paragraphs: [
          'The current store is organized into Editor Upgrades, TD Upgrades, Profile Upgrades, and a combined preview mode that lets you see the pieces together. In plain English, that means you can browse coding-surface changes, game-surface changes, and profile presentation changes from one place instead of hunting through settings screens.',
          'The store flow is more than a static catalog. It has filters, sorting, quickslots, cart state, preview controls, and equip flows designed for people who want to try combinations before they commit. That matters because customization only feels good when the preview loop is fast. If users cannot see the effect of a choice immediately, the shop becomes bookkeeping. The Packet Bazaar is designed to feel interactive instead of transactional.',
        ],
      },
      {
        heading: 'Why the Packet Bazaar belongs in the city',
        paragraphs: [
          'The city map gave us the right framing for a store. On District 01, the shop is not a random modal or a floating badge in the corner. It is Packet Bazaar, a place you can actually walk into from the Neon Docks Street scene. That sounds cosmetic, but it changes how the feature lands. It feels like a destination inside the product instead of an ad unit stitched on top of it.',
          'More importantly, the city keeps the store honest. The same street loop that takes you to the bazaar also takes you to the contractor office for missions and the module guide studio for learning. In other words, the shop sits beside the practice loop, not above it. That is the right hierarchy. Practice stays primary. Personalization becomes part of the world around it.',
        ],
      },
      {
        heading: 'What this does not change',
        paragraphs: [
          'The existence of a shop does not change the basic deal of the platform. Problems, lessons, clusters, and the core learning flow are still the product. The shop is there for people who want to tune the surrounding experience, not for people trying to unlock the right to learn.',
          'That distinction matters because educational products damage themselves when monetization starts dictating access to the material. We would rather have a store that deepens attachment for the people already showing up than a store that interrupts the people still deciding whether they trust the platform. The Packet Bazaar should feel like a layer of ownership around practice, not a toll booth in front of it.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What can I customize in the CodeGrind shop?',
        answer:
          'Right now the store is organized around editor upgrades, tower defense upgrades, profile upgrades, and a combined preview mode so you can see how pieces fit together before equipping them.',
      },
      {
        question: 'Is the shop part of the city map?',
        answer:
          'Yes. District 01 includes Packet Bazaar as a walkable destination from the street scene, and the store route is wired from that in-world hotspot.',
      },
      {
        question: 'Does adding a shop mean CodeGrind is paywalling learning?',
        answer:
          'No. The learning and practice surfaces remain the core product. The shop exists to support personalization around those surfaces, not to gate the ability to practice.',
      },
    ],
    relatedPages: [
      { label: 'Visit the city map', path: '/city' },
      { label: 'Open the store', path: '/store' },
      { label: 'See platform updates', path: '/updates' },
      { label: 'View your profile', path: '/profile' },
    ],
  },
  {
    slug: 'mobile-mode-codegrind-in-your-pocket',
    title: 'Mobile Mode on CodeGrind Is About Continuity, Not a Shrunk Desktop',
    description:
      'CodeGrind mobile mode adds a route-aware dock, fullscreen controls, install prompts, and phone-friendly shell behavior so the platform feels usable between sessions.',
    keywords:
      'codegrind mobile mode, coding platform mobile ui, pwa coding app, mobile coding game interface, codegrind phone experience',
    publishedAt: '2026-05-14',
    updatedAt: '2026-05-14',
    author: { name: 'CodeGrind Team' },
    heroImage: getNativeBlogHeroImage('Mobile_Mode_NativeBlog_Image.png'),
    eyebrow: 'MOBILE',
    intro:
      'There are two bad ways to build for mobile. One is to block the experience entirely and tell people to come back on desktop. The other is to cram the full desktop interface into a phone-sized box and pretend that counts as support. CodeGrind needed a third option. The new mobile work is about continuity: keeping navigation, shell controls, install flows, and quick actions close enough that the platform still feels alive when you are on a phone instead of at a desk.',
    sections: [
      {
        heading: 'Why mobile had to become a real product surface',
        paragraphs: [
          'People do not only encounter learning products in ideal conditions. They open them during a break, on a commute, from the couch, or between meetings. If the mobile version feels like a broken fallback, the platform quietly trains users to wait until they have perfect conditions to come back. Most of the time they do not.',
          'That is why the mobile work matters even for users who still prefer desktop for longer coding blocks. A good phone experience does not have to replace the main workspace. It has to preserve momentum. If someone can navigate, launch, continue, install, and manage the shell without friction, the platform stops disappearing between “real” sessions.',
        ],
      },
      {
        heading: 'What shipped in the mobile shell',
        paragraphs: [
          'The biggest change is the route-aware mobile dock. Instead of giving every screen the same generic footer, the dock changes behavior based on where you are. It can expose home and profile actions, store and upgrade shortcuts, shell visibility toggles, fullscreen controls, and install actions for supported mobile browsers.',
          'Underneath that, the shell now tracks whether specific surfaces like the home demo, problem workspace, cluster map, tower defense shell, or city route should stay visible. That makes mobile feel intentional instead of brittle. You are not just seeing a compressed desktop page. You are seeing a version of CodeGrind that understands what route you are on and what controls matter there.',
        ],
      },
      {
        heading: 'Why orientation and install prompts matter more than they sound',
        paragraphs: [
          'Some of the least glamorous mobile work is the most important. Store and gameplay surfaces now account for orientation, and the shell can request fullscreen or prompt installation through the browser when that path is available. None of that is splashy, but it removes the small bits of friction that make phone sessions feel temporary and second-class.',
          'The right mental model here is not “mobile edition.” It is “same account, same world, fewer excuses to bounce.” If a user can continue from a phone, then return to desktop later without feeling like they crossed into a different product, the platform becomes easier to keep in rotation.',
        ],
      },
      {
        heading: 'What mobile mode is really trying to protect',
        paragraphs: [
          'The main thing mobile mode protects is habit. Short sessions count. Checking the city, opening the demo, browsing the store, managing profile or shell state, or launching the next step in a learning path all keep the platform mentally close. That closeness matters because consistent practice is usually lost in the gaps between sessions, not inside the sessions themselves.',
          'We are not pretending a phone is the perfect place for every coding task. We are building a version of CodeGrind that respects the fact that people live on phones anyway. The mobile shell is the bridge that keeps the platform usable in those moments instead of turning them into dead time.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is new in CodeGrind mobile mode?',
        answer:
          'The current mobile work centers on a route-aware dock, fullscreen support, install prompts for supported browsers, and shell controls that adapt to the page you are on.',
      },
      {
        question: 'Is CodeGrind trying to replace the desktop experience on mobile?',
        answer:
          'No. The goal is continuity, not a full desktop clone. Mobile mode is there to keep navigation, quick actions, and shorter sessions smooth so users can stay engaged between larger desktop sessions.',
      },
      {
        question: 'Does mobile mode help with the city map too?',
        answer:
          'Yes. The mobile dock explicitly accounts for city routes and keeps the compact shell behavior available on touch-first navigation paths.',
      },
    ],
    relatedPages: [
      { label: 'Open the homepage demo', path: '/' },
      { label: 'Visit the city map', path: '/city' },
      { label: 'Browse the store', path: '/store' },
      { label: 'See all games', path: '/games' },
    ],
  },
  {
    slug: 'homepage-tutorial-real-onboarding-mission',
    title: 'The CodeGrind Homepage Tutorial Is Now a Real Onboarding Mission',
    description:
      'The homepage tutorial now runs a live Code Breach onboarding mission with a real intro problem, clearer guidance, and a clean handoff into learning paths or clusters.',
    keywords:
      'codegrind homepage tutorial, coding game onboarding, live coding demo, code breach tutorial, codegrind onboarding mission',
    publishedAt: '2026-05-14',
    updatedAt: '2026-05-14',
    author: { name: 'CodeGrind Team' },
    heroImage: getNativeBlogHeroImage('TD_Tutorial_refresh_NativeBlog_Image.png'),
    eyebrow: 'ONBOARDING',
    intro:
      'Homepage demos usually lie a little. They show a motion reel, a fake terminal, or a watered-down mini interaction that feels nothing like the actual product. We wanted the opposite. The CodeGrind homepage tutorial now runs a real onboarding mission from the learning path flow, embedded directly into the landing experience. That means a visitor does not just watch the pitch. They solve an intro problem, defend the base, and then step into the next part of the platform from there.',
    sections: [
      {
        heading: 'Why the old idea of a tutorial was not enough',
        paragraphs: [
          'A tutorial should not be a decorative layer hovering above the real product. If the first interaction teaches a different rhythm from the one users will meet after signup, it trains the wrong instincts. That is one of the fastest ways to create drop-off right after the first click.',
          'The homepage now solves that by embedding the real tower defense onboarding level instead of a fake stand-in. The mission is tied to the same learning-path structure, the same onboarding identifiers, and the same gameplay logic we use elsewhere. The landing page is finally showing the product as it actually behaves.',
        ],
      },
      {
        heading: 'What the new homepage flow actually does',
        paragraphs: [
          'The experience opens with a full boot-sequence layer, then hands off into a live Code Breach demo. Visitors are not just reading about tower defense coding. They are walking into the intro shell, seeing the grid and mission feed come online, and clearing a small real problem under the same gameplay framing the rest of the platform uses.',
          'Once that mission ends, the page does not strand people. The copy and follow-up flow explicitly position the next decision: keep going through the beginner learning path or move toward interview prep clusters. That is a stronger funnel than a generic “sign up now” button because it turns the first success into a concrete next step.',
        ],
      },
      {
        heading: 'What we improved inside the tutorial itself',
        paragraphs: [
          'The recent homepage work was not just about embedding the mission. We also tightened the guidance inside it. Slot locking and reveal timing were adjusted, the early demo sequence got clearer progression, and the tactical callouts became more explicit. Those sound like small tweaks, but onboarding quality usually comes down to small clarifications stacked together.',
          'When someone is seeing the product for the first time, every ambiguous cue feels larger than it really is. Better callouts, better reveal steps, and cleaner pacing do not just make the mission more polished. They reduce the odds that a promising user misreads the system in the first ninety seconds and leaves before the fun part lands.',
        ],
      },
      {
        heading: 'Why a real onboarding mission is better for SEO too',
        paragraphs: [
          'Search traffic converts better when the landing experience matches the query that brought someone in. If a person searches for a coding game, a tower defense coding platform, or a beginner-friendly coding demo, the homepage now answers that intent directly. It does not just describe the loop. It demonstrates it.',
          'That matters for native blog strategy too, because owned content can now point readers to a homepage experience with a precise promise: solve a real intro problem, defend the base, and then choose where to go next. The tighter that promise is, the easier it is to write content that ranks honestly and holds attention after the click.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is the homepage demo a real CodeGrind mission now?',
        answer:
          'Yes. The homepage tutorial now embeds the real onboarding mission used in the learning-path flow rather than a fake or heavily simplified placeholder.',
      },
      {
        question: 'What happens after I finish the homepage tutorial?',
        answer:
          'The flow is designed to hand you into the next meaningful step, especially the beginner learning path or the interview-prep cluster route, instead of dropping you onto a dead-end marketing page.',
      },
      {
        question: 'What changed in the tutorial guidance?',
        answer:
          'The onboarding sequence now has clearer reveal timing, more explicit callouts, and a better early-mission structure so new users understand the loop faster.',
      },
    ],
    relatedPages: [
      { label: 'Play the homepage demo', path: '/' },
      { label: 'Start learning paths', path: '/learning' },
      { label: 'Browse problem clusters', path: '/games/clusters' },
      { label: 'Read platform updates', path: '/updates' },
    ],
  },
  {
    slug: 'city-map-walking-between-environments',
    title: 'Why CodeGrind Built a City Map You Can Actually Walk Through',
    description:
      'CodeGrind now has a walkable city map with an apartment, street loop, mission office, learning studio, and shop so movement between product areas feels immersive.',
    keywords:
      'codegrind city map, walkable coding platform, district 01 codegrind, immersive coding game ui, city navigation learning platform',
    publishedAt: '2026-05-14',
    updatedAt: '2026-05-14',
    author: { name: 'CodeGrind Team' },
    heroImage: getNativeBlogHeroImage('Walkable_City_NativeBlog_Image.png'),
    eyebrow: 'CITY MAP',
    intro:
      'One of the biggest limits on most coding platforms is that every important action happens through the same flat pattern: click a tab, load a page, repeat. That is efficient, but it does not create any sense of place. CodeGrind now has the beginning of a different answer. The new city map lets you walk through District 01, moving from an apartment safehouse onto the street and into different destinations that map to real product surfaces. It is navigation, but it is also atmosphere.',
    sections: [
      {
        heading: 'Why a city layer changes the feel of the platform',
        paragraphs: [
          'Menus are good at being clear, but they are bad at making a product feel inhabited. When learning, missions, profile, store, and progression are all presented as equivalent links, the platform can feel like a toolkit rather than a world. That is fine for pure utility. It is not enough for a product trying to make practice feel memorable.',
          'A city layer changes that by giving movement context. You do not just open the store. You leave the safehouse, cross Neon Docks Street, and enter Packet Bazaar. You do not just click into learning. You walk into the Module Guide Studio. Those are still routes underneath, but the route has a place wrapped around it now, and that small shift changes how the whole platform reads.',
        ],
      },
      {
        heading: 'What District 01 includes right now',
        paragraphs: [
          'The current District 01 loop starts in the Apartment Safehouse, moves out to Neon Docks Street, and branches into three early destinations: the Array Fixer Office for mission and cluster routing, Packet Bazaar for the store, and the Module Guide Studio for learning-path entry. That is already enough to prove the idea, because the core product areas are no longer isolated screens.',
          'The map data is not vague concept art either. It already defines walk bounds, exits, hotspot zones, travel transitions, scene art, and avatar states. The platform knows where the player starts, where they can move, and which destination should launch when they interact with a scene hotspot. That is what makes this feel like a foundation instead of a mockup.',
        ],
      },
      {
        heading: 'Why walking matters more than clicking',
        paragraphs: [
          'Walking gives the user a moment between contexts. That pause is useful. It turns “I am switching pages” into “I am going somewhere.” On a platform built around repeated practice, those small transitions help the product feel less like administrative work and more like a place you return to.',
          'It also creates room for the platform to grow without feeling chaotic. A city can add new districts, offices, vendors, instructors, and mission boards while preserving a mental model people already understand. That is easier to scale than an ever-expanding top nav full of increasingly abstract labels.',
        ],
      },
      {
        heading: 'Why this is additive instead of disruptive',
        paragraphs: [
          'The best thing about the current city implementation is that it does not try to replace proven routes. The contractor office still bridges back into clusters. The learning studio still routes into learning. The bazaar still routes into the store. The city shell adds immersion and continuity around the existing product instead of forcing a rewrite of every path people already know.',
          'That additive approach is the reason the feature is worth shipping early. We do not need the entire world finished before the first district is useful. District 01 already gives users a stronger sense of place, a stronger link between major product surfaces, and a better foundation for future content. That is enough to matter right now.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What places can you visit on the CodeGrind city map right now?',
        answer:
          'District 01 currently includes the Apartment Safehouse, Neon Docks Street, the Array Fixer Office, the Module Guide Studio, and Packet Bazaar, each tied to a real navigation outcome or product surface.',
      },
      {
        question: 'Is the city map just a visual layer?',
        answer:
          'No. The scenes already define exits, walk bounds, hotspot interactions, travel transitions, and route actions that connect to learning, missions, and the store.',
      },
      {
        question: 'Does the city replace normal navigation?',
        answer:
          'Not at this stage. The city is additive. It gives the platform a more immersive navigation layer while still routing into the same proven product surfaces underneath.',
      },
    ],
    relatedPages: [
      { label: 'Enter the city', path: '/city' },
      { label: 'Browse mission clusters', path: '/games/clusters' },
      { label: 'Open learning paths', path: '/learning' },
      { label: 'Visit the store', path: '/store' },
    ],
  },
  {
    slug: 'visualizing-data-structures-beats-burnout',
    title: 'Visualizing Data Structures: Why Static Code Blocks Cause Interview Burnout',
    description:
      'Staring at static code blocks makes learning data structures dry and exhausting. Here is how visual rendering and interactive game loops beat coding interview burnout.',
    keywords:
      'visualizing data structures, coding interview burnout, static code blocks, interactive data structures, codegrind code breach',
    publishedAt: '2026-06-17',
    updatedAt: '2026-06-17',
    author: { name: 'CodeGrind Team' },
    heroImage: getNativeBlogHeroImage('visualizing-data-structures.png'),
    video: getNativeBlogVideo('Short_Two_Sum_TD_Active_Play_And_Code_Retro_Art_Preview - Copy.mp4'),
    eyebrow: 'VISUAL LEARNING',
    intro:
      'Most developers study data structures by looking at passive, static text blocks on a screen. You read a snippet of code, try to trace the pointers in your head, and hope you understand the state changes. This high cognitive load is a primary driver of coding interview burnout. CodeGrind replaces static representations with visual rendering and an active web-canvas game loop, letting you see data structures execute in real-time.',
    draft: false,
    sections: [
      {
        heading: 'The cognitive tax of static code blocks',
        paragraphs: [
          'If you open a traditional coding site or computer science textbook, you are greeted by static blocks of code. To understand how a linked list reverses or how a stack functions, you must run the code mentally. You are acting as the compiler, tracking variables, references, and array indices in your head.',
          'This manual tracking is exhausting. It is not the actual problem-solving or algorithmic thinking that burns candidates out; it is the sheer mental bookkeeping required to simulate computer memory on a notepad. By the time you finish two problems, your working memory is depleted, making consistency nearly impossible to maintain.',
        ],
      },
      {
        heading: 'Why visualization changes how you learn',
        paragraphs: [
          'Interactive visualization offloads this mental bookkeeping. When you can see a queue fill up, a binary tree balance, or a graph search expand its frontier node-by-node on a web canvas, you do not have to guess. The state changes are externalized and visible.',
          'This immediate visual feedback creates a stronger connection between syntax and behavior. When your code changes an index, you instantly see the pointer shift on screen. If your loop causes an off-by-one error, the visual structure breaks or misaligns right before your eyes. You spend your energy understanding the algorithm rather than maintaining a mental whiteboard.',
        ],
      },
      {
        heading: 'The web-canvas game loop vs. traditional text boxes',
        paragraphs: [
          'CodeGrind takes visual learning a step further with the Code Breach game loop. Instead of submitting code to a black box and waiting for a checklist of test cases, your code drives a real-time simulation on a canvas. The data structure decisions you make directly determine the efficiency of your defenses.',
          'This interactive web-canvas loop turns abstract arrays and hash tables into physical towers, paths, and waves. Passing a test case clears an enemy wave. Writing an inefficient O(N^2) solution instead of an O(N) one results in your defenses running out of time. By mapping Big-O complexity directly to game performance, the loop makes algorithmic trade-offs visible and intuitive.',
        ],
      },
      {
        heading: 'How to build a sustainable visual study routine',
        paragraphs: [
          "To avoid interview burnout, pivot your study away from static grind sheets. Start by exploring visual representations of the structure you want to learn. Next, write the code in CodeGrind's editor to see how syntax updates the visual state. Finally, test your understanding in a Code Breach tower defense mission where you can watch your code execute live.",
          'By alternating between conceptual visualization, hands-on editor practice, and real-time game verification, you keep your brain engaged and reduce the cognitive friction that makes traditional study feel like a chore.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How does visualization prevent coding interview burnout?',
        answer:
          'Burnout is often caused by the exhaustion of tracking complex state changes mentally. Visual rendering offloads this bookkeeping to the screen, letting you focus on the logical design of the algorithm instead of simulating memory.',
      },
      {
        question: 'Does CodeGrind use a real game loop for coding practice?',
        answer:
          'Yes. Code Breach uses a real-time web-canvas game loop powered by real code execution. The code you write in the editor runs against unit tests, and the results feed back into the canvas simulation in real-time.',
      },
      {
        question: 'Are visual learning platforms rigorous enough for FAANG interviews?',
        answer:
          'Absolutely. Rigor comes from the problems and constraints, not from how dry the interface is. CodeGrind runs your code against strict hidden test cases and performance constraints, ensuring your visual solutions are clean, efficient, and interview-ready.',
      },
    ],
    relatedPages: [
      { label: 'Tower defense coding game', path: '/tower-defense-coding-game' },
      { label: 'Gamified coding practice', path: '/gamified-coding-practice' },
      { label: 'LeetCode alternative guide', path: '/leetcode-alternatives' },
      { label: 'Browse problems', path: '/problems' },
    ],
  },
];

export const NATIVE_BLOG_POST_PATHS = NATIVE_BLOG_POSTS.filter((post) => !post.draft).map(
  (post) => `/blog/codegrind/${post.slug}`
);

export const getNativeBlogPostBySlug = (slug) =>
  NATIVE_BLOG_POSTS.find((post) => !post.draft && post.slug === slug) || null;

export const getPublishedNativeBlogPosts = () =>
  NATIVE_BLOG_POSTS.filter((post) => !post.draft).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
