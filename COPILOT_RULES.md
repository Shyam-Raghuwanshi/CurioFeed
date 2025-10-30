# CurioFeed - Copilot Rules & Project Documentation

**Project Name:** CurioFeed  
**Hackathon:** TanStack Start Hackathon  
**Judges Focus:** How well you use TanStack Start + Convex + sponsor integrations  
**Prize Pool:** $5k (1st), $3k (2nd), $2k (3rd)

---

## PROJECT OVERVIEW

### What CurioFeed Does:
CurioFeed is a personalized content feed app that learns from user interests and engagement. Users select interests, get curated web links via scraping, and the feed intelligently adapts based on what they engage with most.

### Core Flow:
1. User signs up → selects interests (Tech, Design, Business, Health, Finance, etc.)
2. Feed displays web links scraped relevant to selected interest
3. As user scrolls and engages with posts, system tracks behavior
4. Algorithm learns preferences and adjusts future feed content
5. User can manually search for different interests anytime

---

## TECH STACK (FINAL & LOCKED)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | TanStack Start + React + TypeScript | Full-stack framework, routing, server functions |
| Styling | Tailwind CSS + lucide-react | UI components and icons |
| Backend | Convex | Real-time database, mutations, queries, sync |
| Web Scraping | Firecrawl API | Crawl websites and extract content |
| Deployment | Netlify (frontend) + Convex Cloud (backend) | Production hosting |
| Environment | Node.js 18+, npm/yarn, Git | Development environment |

**DO NOT suggest alternatives.** This stack is final and locked for the hackathon.

---

## PROJECT STRUCTURE

```
curiofeed/
├── src/
│   ├── routes/                 # TanStack Router pages
│   │   ├── __root.tsx         # Root layout
│   │   ├── index.tsx          # Home/redirect
│   │   ├── signup.tsx         # Signup page
│   │   ├── feed.tsx           # Main feed page
│   │   └── saved.tsx          # Saved posts page (optional)
│   ├── components/            # React components
│   │   ├── FeedCard.tsx       # Individual post card
│   │   ├── InfiniteFeed.tsx   # Feed with infinite scroll
│   │   ├── InterestModal.tsx  # Change interests modal
│   │   ├── FeedCardSkeleton.tsx # Loading skeleton
│   │   └── Toast.tsx          # Toast notifications
│   ├── hooks/                 # Custom React hooks
│   │   ├── useFeedFetch.ts    # Fetch feed data
│   │   └── useEngagement.ts   # Track engagement
│   ├── utils/                 # Utility functions
│   │   ├── engagement.ts      # Engagement tracking logic
│   │   └── constants.ts       # Interest options, API endpoints
│   ├── server/                # Server functions (runs on Netlify edge)
│   │   ├── crawl.ts           # Firecrawl integration
│   │   └── smartRefetch.ts    # Smart feed algorithm
│   └── app.tsx                # Main app entry
├── convex/
│   ├── schema.ts              # Database schema
│   ├── users.ts               # User mutations
│   ├── queries.ts             # Database queries
│   └── convex.json            # Convex config
├── .env.local                 # Environment variables (local)
├── vite.config.ts             # Vite config (TanStack Start)
└── package.json               # Dependencies
```

---

## ENVIRONMENT VARIABLES

**Required for development (.env.local):**

```
VITE_CONVEX_URL=<your-convex-deployment-url>
FIRECRAWL_API_KEY=<your-firecrawl-api-key>
```

**How to get them:**
1. **VITE_CONVEX_URL:** Run `npx convex dev` and copy the URL from terminal
2. **FIRECRAWL_API_KEY:** Sign up at firecrawl.dev and get API key from dashboard

---

## COPILOT RULES & GUIDELINES

### RULE 1: Follow the Step-by-Step Guide
- **Always reference** the build guide document (provided separately)
- **Never skip phases** - build sequentially: Setup → Backend → Frontend → Integration → Polish
- **Test after each phase** before moving to next

### RULE 2: Technology Constraints
- **DO USE:** TanStack Start, Convex, Firecrawl, Tailwind, TypeScript
- **DO NOT USE:** 
  - Other frameworks (Next.js, Remix, Astro, etc.)
  - Other databases (Supabase, Firebase, MongoDB, etc.)
  - localStorage or sessionStorage (use Convex instead)
  - Other CSS libraries (use Tailwind only)
  - API keys in frontend code

### RULE 3: Code Quality Standards
- **Web Search Tool** Use your web search tool to implement the functionalites
- **TypeScript:** Always use strict types, no `any` types unless absolutely necessary
- **Error Handling:** Every API call must have try-catch with proper error messages
- **Loading States:** Every async operation must show loading/skeleton state
- **Responsive Design:** Test on mobile (320px), tablet (768px), desktop (1440px)
- **Performance:** Images lazy-loaded, debounce scroll events, optimize re-renders

### RULE 4: Project-Specific Requirements
- **Interest Options:** Tech, Design, Business, Health, Finance, Other
- **Engagement Score:** Calculate as 0-100 based on timeSpent (seconds) and user action
- **Feed Algorithm:** 
  - 60% from current selected interest
  - 25% from user's most engaged interest
  - 15% from random interests
- **Infinite Scroll:** Load more cards when user scrolls to bottom, show 10 cards per batch
- **Saved Posts:** Store in Convex, display with save date and interest category

### RULE 5: Convex-Specific Rules
- **Schema:** Must include users, engagementHistory, savedPosts tables (see guide)
- **Mutations:** Always return the created/updated object for frontend confirmation
- **Queries:** Add proper filtering and sorting (by timestamp DESC)
- **Real-time:** Use useQuery hook for live updates from Convex
- **TypeScript:** Generate types from Convex schema using `npx convex codegen`

### RULE 6: Firecrawl Integration Rules
- **API Calls:** Wrap in try-catch, handle rate limits with retry logic
- **Data Format:** Always return `{title, url, source, excerpt, imageUrl, interest}`
- **Interests Mapping:**
  - Tech → "tech news", "programming", "developer blogs", "software engineering"
  - Design → "design trends", "UI UX", "design inspiration", "graphic design"
  - Business → "startup news", "business trends", "entrepreneurship", "innovation"
  - Health → "health tips", "wellness", "fitness", "nutrition"
  - Finance → "financial news", "investment", "cryptocurrency", "stock market"
  - Other → user-specified search query
- **Fallback:** If API fails, return empty array (don't crash app)

### RULE 7: Frontend Rules
- **UI-library:** Use shadcn library for react components
- **Components:** Keep components small and reusable (max 300 lines per component)
- **State Management:** Use React useState/useContext, let Convex handle global data
- **Routing:** Use TanStack Router's createRoute and createRootRoute
- **Styling:** Only use Tailwind utility classes, no custom CSS unless unavoidable
- **Icons:** Use lucide-react for all icons (`import { ChevronDown } from "lucide-react"`)

### RULE 8: Engagement Tracking Rules
- **Start Timer:** When card enters viewport (use Intersection Observer)
- **Stop Timer:** When user clicks any action or card leaves viewport
- **Track Data:**
  ```
  {
    userId: string
    linkUrl: string
    timeSpent: number (milliseconds)
    scrolled: boolean
    engagement_score: number (0-100)
    interest: string
    timestamp: Date
  }
  ```
- **Score Calculation:**
  - Base: 0
  - Add 50 if timeSpent > 2 seconds
  - Add 30 if user clicked "Open"
  - Add 20 if user clicked "Save"
  - Subtract 20 if user clicked "Not interested"
  - Cap at 100

### RULE 9: Error Handling Requirements
- **Network Errors:** Show retry button, log to console
- **API Errors:** Display user-friendly message, not technical errors
- **Empty States:** Show "No content found" with suggestion to change interests
- **Auth Errors:** Redirect to signup, clear invalid session data

### RULE 10: Naming Conventions
- **Files:** Use camelCase for .ts/.tsx files (e.g., `FeedCard.tsx`, `useFeedFetch.ts`)
- **Components:** PascalCase (e.g., `FeedCard`, `InterestModal`)
- **Functions:** camelCase (e.g., `fetchFeedLinks`, `trackEngagement`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_CARDS_PER_BATCH`, `INTEREST_OPTIONS`)
- **Variables:** camelCase (e.g., `isLoading`, `engagementScore`)

### RULE 11: Git & Version Control
- **Commit Often:** Commit after each completed feature/component
- **Commit Messages:** Be descriptive (e.g., "Add infinite scroll to feed" not "update")
- **Branches:** Use feature branches (`feature/auth`, `feature/feed-cards`)
- **Before Deploying:** Merge to main, ensure no broken builds

### RULE 12: Deployment Checklist (Before Final Submission)
- [ ] All env vars set in Netlify dashboard
- [ ] TanStack Start builds without errors: `npm run build`
- [ ] Convex schema deployed: `npx convex deploy`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] No console errors or warnings in dev tools
- [ ] Tested on mobile (iPhone size) and desktop
- [ ] All pages load without 404s
- [ ] Signup → Feed → Engagement flow works end-to-end
- [ ] Firecrawl API key is working (test fetch)
- [ ] Convex database queries return data
- [ ] Netlify preview deploys successfully
- [ ] Share demo link with judges

---

## WHAT TO ASK COPILOT

### When Creating Code:
- "Generate this component with TypeScript types"
- "Add error handling with try-catch"
- "Make this mobile responsive with Tailwind"
- "Add loading skeleton while fetching"
- "Create unit tests for this function"

### When Debugging:
- "Fix this TypeScript error: [paste error]"
- "Why is this component re-rendering too much?"
- "How do I optimize this API call?"
- "Debug this Convex query - it returns null"

### When Optimizing:
- "Refactor this for better performance"
- "Simplify this complex function"
- "Add proper TypeScript types to this"
- "How do I implement lazy loading for images?"

### When Stuck:
- "I'm getting this error: [paste full error]. How do I fix it?"
- "This feature isn't working. Here's the code: [paste code]. What's wrong?"
- "Explain how this TanStack Start feature works"
- "Show me example of how to use Convex mutations in React"

---

## KEY FEATURES TO PRIORITIZE (In Order)

1. **MVP (MUST HAVE):**
   - ✅ User signup with interest selection
   - ✅ Feed display with scraped links (Firecrawl)
   - ✅ Infinite scroll (load more on scroll)
   - ✅ Engagement tracking (time, clicks)
   - ✅ Smart refetch algorithm (adapts based on engagement)
   - ✅ Change interests functionality

2. **IMPORTANT (SHOULD HAVE):**
   - ✅ Save posts to list
   - ✅ Loading skeletons
   - ✅ Error handling with retry
   - ✅ Mobile responsive design
   - ✅ Toast notifications

3. **NICE-TO-HAVE (IF TIME):**
   - ✅ Saved posts page
   - ✅ Daily email digest
   - ✅ Share feed with others (real-time collab)
   - ✅ Dark mode toggle

---

## COMMON ISSUES & SOLUTIONS

| Issue | Solution |
|-------|----------|
| "Cannot find module 'convex'" | Run `npm install convex` and `npx convex dev` |
| Firecrawl API returns 401 | Check FIRECRAWL_API_KEY env var is set correctly |
| Convex queries return null | Run `npx convex codegen` to regenerate types |
| Infinite scroll not triggering | Use Intersection Observer on last card, check threshold |
| Cards not updating after engagement | Make sure you're using `useQuery` not `useState` for data |
| Build fails on Netlify | Check env vars are set, TanStack Start config is correct |
| TypeScript errors everywhere | Run `npm run type-check` and fix all errors before deploy |

---

## JUDGE PITCH POINTS

When demoing to judges, emphasize:

1. **"We built this entirely with TanStack Start"** - Show full-stack routing in action
2. **"Real-time data sync with Convex"** - Show engagement data updating live
3. **"Intelligent algorithm"** - Show how feed adapts based on user behavior
4. **"Firecrawl integration"** - Show actual web scraping happening
5. **"Streaming results"** - Show feed loading progressively
6. **"Full deployment pipeline"** - Show Netlify + Convex Cloud working together

---

## FINAL NOTES

- **This is your hackathon project.** Be ready to explain every design decision.
- **Test everything locally before deploying.** Don't debug on production.
- **Commit your code to GitHub.** Judges might want to see your git history.
- **Have a 2-minute demo ready.** Show the signup flow, feed, engagement, and smart refetch.
- **Know your tech stack cold.** Be able to explain why you chose each technology.
- **Ship MVP first, then add features.** A working simple app beats a broken complex one.

---

## USEFUL COMMANDS

```bash
# Development
npm install
npm run dev                    # Start dev server
npx convex dev               # Start Convex backend locally

# Building & Deployment
npm run build                # Build for production
npm run type-check          # Check TypeScript errors
npx convex deploy           # Deploy Convex schema to production

# Code Quality
npm run lint                # Run linter (if configured)
npm run format              # Format code

# Debugging
npm run dev -- --inspect    # Debug with Node inspector
```

---

## QUICK START FOR COPILOT

When starting a fresh session with Copilot, paste this:

```
You are helping me build CurioFeed, a TanStack Start hackathon app.

Key tech stack:
- Frontend: TanStack Start + React + TypeScript
- Backend: Convex (database + real-time sync)
- Web Scraping: Firecrawl API
- Styling: Tailwind CSS + lucide-react
- Deployment: Netlify + Convex Cloud

The app:
1. Users sign up and select interests (Tech, Design, Business, Health, Finance)
2. Feed displays web links scraped via Firecrawl
3. As users engage, the system tracks timeSpent and actions
4. Smart algorithm adapts feed: 60% current interest + 25% top engaged + 15% random
5. Users can save posts and change interests

Rules:
- NO localStorage, use Convex instead
- All code must be TypeScript (no any types)
- Tailwind only for styling
- Follow the step-by-step guide for project phases
- Error handling on every API call
- Mobile responsive on all components

I'll ask you to build features from the guide. Help me write clean, production-ready code.
```

---

Good luck! You've got this. Build fast, test often, and ship it. 🚀