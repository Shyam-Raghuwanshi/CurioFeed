# Clerk Authentication Setup Instructions

## 🔐 Clerk Authentication Integration Complete!

Your CurioFeed app now has full Clerk authentication integration with Convex. Here's what has been implemented and what you need to do to complete the setup.

## ✅ What's Been Implemented

### 1. Dependencies Installed
- `@clerk/clerk-react` - Clerk React SDK for authentication components

### 2. Convex Schema Updated
- Modified `users` table to use `clerkId` instead of email/name
- Removed email and name fields (handled by Clerk)
- Updated indexes to use `by_clerk_id`

### 3. Authentication Components Created
- **SignInPage** (`/src/components/SignInPage.tsx`) - Beautiful sign-in page
- **SignUpPage** (`/src/components/SignUpPage.tsx`) - User registration page  
- **OnboardingPage** (`/src/components/OnboardingPage.tsx`) - Interest selection after signup
- **FeedPage** (`/src/components/FeedPage.tsx`) - Protected main feed
- **ProtectedRoute** (`/src/components/ProtectedRoute.tsx`) - Route protection wrapper

### 4. Convex Functions Updated
- `createUser` - Now uses Clerk authentication context
- `getCurrentUser` - Gets user by Clerk ID
- `updateUserInterests` - Uses authenticated user context
- All functions now include proper authentication checks

### 5. App Integration
- `App.tsx` wrapped with `ClerkProvider` and `ConvexProviderWithClerk`
- Router updated with authentication routes
- Home page updated with auth flow logic

### 6. Route Structure
```
/ - Landing page (redirects based on auth status)
/sign-up - User registration
/sign-in - User login  
/onboarding - Interest selection (protected)
/feed - Main app feed (protected)
```

## 🚀 Required Setup Steps

### 1. Create Clerk Application
1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Choose "Email, Phone, Username" or your preferred sign-in methods
4. Copy your API keys

### 2. Update Environment Variables
In your `.env.local` file, replace the placeholder values:

```bash
# Replace with your actual Clerk keys
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_actual_secret_key_here
```

**Important:** 
- `VITE_CLERK_PUBLISHABLE_KEY` should start with `pk_test_` or `pk_live_`
- `CLERK_SECRET_KEY` should start with `sk_test_` or `sk_live_`

### 3. Configure Clerk Dashboard
In your Clerk dashboard:

1. **Paths Configuration:**
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up` 
   - After sign-in URL: `/onboarding`
   - After sign-up URL: `/onboarding`

2. **Allowed Redirect URLs:**
   - Add `http://localhost:5174` (or your dev port)
   - Add `http://localhost:5174/onboarding`
   - Add `http://localhost:5174/feed`

3. **Enable Email/Username authentication** (or your preferred methods)

## 🧪 Testing the Authentication Flow

### Prerequisites
1. Both servers should be running:
   ```bash
   # Terminal 1
   npx convex dev
   
   # Terminal 2  
   npm run dev
   ```

2. Your Clerk keys should be properly set in `.env.local`

### Test Flow
1. **Visit** `http://localhost:5174/`
   - Should show landing page with "Get Started" and "Sign In" buttons

2. **Click "Get Started"**
   - Should redirect to `/sign-up`
   - Fill out the sign-up form
   - Should redirect to `/onboarding` after successful signup

3. **Complete Onboarding**
   - Select your interests
   - Click "Continue to Feed"
   - Should redirect to `/feed`

4. **Test Sign Out/In**
   - Click user button in top right
   - Sign out
   - Visit `/feed` directly - should redirect to sign-in
   - Sign in - should go to feed (skipping onboarding)

## 🔍 Troubleshooting

### Common Issues

1. **"Missing Publishable Key" Error**
   - Make sure `VITE_CLERK_PUBLISHABLE_KEY` is set in `.env.local`
   - Restart the dev server after adding env vars

2. **Redirect Loops**
   - Check Clerk dashboard redirect URLs
   - Ensure all URLs are added to allowed redirects

3. **"Not authenticated" Errors**
   - Check that ConvexProviderWithClerk is properly set up
   - Verify Clerk secret key is correct

4. **Database Errors**
   - Make sure Convex dev is running
   - Check that schema deployed successfully

### Debug Steps
```bash
# Check if env vars are loaded
console.log(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

# Check Convex connection
npx convex dashboard

# Check logs
# Frontend: Browser console
# Backend: Convex dev terminal
```

## 🎯 Next Steps

Once authentication is working:

1. **Implement Feed Algorithm** - Use user interests to curate content
2. **Add Firecrawl Integration** - Scrape content based on interests  
3. **Engagement Tracking** - Track user interactions with content
4. **Save Functionality** - Let users save articles
5. **Profile Management** - Allow users to update interests

## 📁 File Structure Created

```
src/
├── components/
│   ├── SignInPage.tsx      # Login page
│   ├── SignUpPage.tsx      # Registration page  
│   ├── OnboardingPage.tsx  # Interest selection
│   ├── FeedPage.tsx        # Main feed (protected)
│   └── ProtectedRoute.tsx  # Route protection
├── App.tsx                 # Updated with Clerk providers
├── Home.tsx                # Updated with auth logic
└── router.tsx              # Updated with auth routes

convex/
├── schema.ts               # Updated for Clerk users
└── users.ts                # Updated with auth context
```

Your authentication system is now complete and ready for testing! 🎉