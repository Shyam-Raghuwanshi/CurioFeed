# CurioFeed

A personalized content feed app built with React + Convex with intelligent engagement tracking and content recommendations.

## 🚀 Tech Stack

- **Frontend**: React + TypeScript + TanStack Router
- **Backend**: Convex (real-time database)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS + lucide-react
- **Web Scraping**: Firecrawl API
- **Deployment**: Vite + Convex Cloud

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Convex account (free)
- Clerk account (free)
- Firecrawl API key (optional)

## 🔧 Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with:
   ```bash
   # Convex Configuration (Required)
   VITE_CONVEX_URL=https://your-convex-deployment-url.convex.cloud
   
   # Clerk Authentication (Required)
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here
   
   # Firecrawl API (Optional - for content scraping)
   FIRECRAWL_API_KEY=your_firecrawl_api_key_here
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
├── components/          # React components  
├── hooks/              # Custom React hooks
├── utils/              # Utility functions & constants
├── context/            # React context providers
└── server/             # Server functions

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

### ✅ Completed Features

- **User Authentication**: Complete signup/signin flow with Clerk
- **User Onboarding**: Interest selection with localStorage persistence
- **Personalized Feed**: Content feed based on user interests
- **Engagement Tracking**: Track user interactions (time spent, scrolling, clicks)
- **Save Posts**: Bookmark functionality with Convex storage
- **Engagement History**: View detailed interaction history
- **Smart Feed Algorithm**: Intelligent content recommendation
- **Real-time Sync**: Live updates with Convex
- **Environment Validation**: Automatic configuration checking

### 🔧 Convex Integration

The app now includes full Convex client integration:

1. **SignUp Component**:
   - Imports `useUser` from Clerk and stores userId in localStorage
   - Redirects to onboarding for interest selection
   - Creates Convex user record after interest selection

2. **Feed Component**:
   - Uses `useQuery(api.queries.getEngagementHistory)` to fetch user data
   - Uses `useMutation(api.users.trackEngagement)` to log interactions
   - Uses `useMutation(api.users.savePost)` to save posts
   - Shows engagement history and saved posts in modal dialogs

3. **Database Schema**:
   - `users`: User profiles with interests and onboarding status
   - `engagementHistory`: Tracks user interactions with content
   - `savedPosts`: Stores user bookmarked content
   - `feedCache`: Cached content for different interests

## 🎯 Environment Setup

See `CONVEX_SETUP.md` for detailed setup instructions and troubleshooting.

The environment is automatically validated on startup. Check your browser console for configuration status.

## 🚀 Next Steps

1. **Content Integration**: Connect real content sources
2. **Advanced Analytics**: Add engagement insights dashboard
3. **Social Features**: User profiles and content sharing
4. **Mobile App**: React Native version
5. **AI Recommendations**: Machine learning-based content suggestions

Ready to personalize your content experience! 🚀
