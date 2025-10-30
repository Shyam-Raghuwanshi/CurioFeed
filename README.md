# CurioFeed

A personalized content feed app built with TanStack Start + Convex for the TanStack Start Hackathon.

## 🚀 Tech Stack

- **Frontend**: TanStack Start + React + TypeScript
- **Backend**: Convex (real-time database)
- **Styling**: Tailwind CSS + lucide-react
- **Web Scraping**: Firecrawl API
- **Deployment**: Netlify + Convex Cloud

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Convex account (free)
- Firecrawl API key

## 🔧 Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   - Copy `.env.local` and update the values:
   ```bash
   # Already configured from Convex init
   VITE_CONVEX_URL=https://your-deployment.convex.cloud
   
   # Get this from https://firecrawl.dev
   FIRECRAWL_API_KEY=your-firecrawl-api-key-here
   ```

3. **Start Convex development server**:
   ```bash
   npx convex dev
   ```

4. **Start the development server** (in another terminal):
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
src/
├── routes/              # TanStack Router pages
├── components/          # React components  
├── hooks/              # Custom React hooks
├── utils/              # Utility functions & constants
└── server/             # Server functions (Netlify edge)

convex/
├── schema.ts           # Database schema
├── users.ts            # User mutations  
├── queries.ts          # Database queries
└── _generated/         # Auto-generated types
```

## 🛠️ Development

- **Build**: `npm run build`
- **Type check**: `npm run lint` 
- **Deploy Convex**: `npx convex deploy`

## 📖 Features

- ✅ User signup with interest selection
- ✅ Personalized content feed
- ✅ Engagement tracking
- ✅ Smart feed algorithm
- ✅ Save posts functionality
- ✅ Real-time sync with Convex

## 🎯 Next Steps

Follow the step-by-step guide in `COPILOT_RULES.md` to build:

1. **Setup** ✅ (Complete)
2. **Backend** ✅ (Complete)  
3. **Frontend** (Next)
4. **Integration**
5. **Polish**

Ready to start building! 🚀
