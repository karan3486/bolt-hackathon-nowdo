# NowDo - Productivity App

A comprehensive productivity application built with Expo and React Native, featuring task management, habit tracking, Pomodoro timer, and more.

## Features

- **Authentication**: Email/password and Google OAuth sign-in
- **Task Management**: Create, organize, and track tasks with priorities
- **Habit Tracking**: Build and maintain daily habits
- **Pomodoro Timer**: Focus sessions with customizable intervals
- **Priority Matrix**: Organize tasks using the Eisenhower Matrix
- **Calendar View**: Visualize tasks and habits over time
- **Dark/Light Theme**: Automatic theme switching based on system preferences

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nowdo-productivity-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your Supabase project:
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key to `.env`
   - Set up Google OAuth in Supabase dashboard (optional)

5. Start the development server:
```bash
npm run dev
```

## Authentication Setup

### Email/Password Authentication

Email and password authentication works out of the box with Supabase. Users can:
- Sign up with email and password
- Sign in with existing credentials
- Reset their password via email

### Google OAuth Setup

To enable Google sign-in:

1. **Configure Google OAuth in Supabase:**
   - Go to your Supabase dashboard
   - Navigate to Authentication > Providers
   - Enable Google provider
   - Add your Google OAuth credentials

2. **Set up Google OAuth credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - `http://localhost:8081` (for development)

3. **Configure redirect URLs:**
   - In Supabase dashboard, set site URL to your production domain
   - Add redirect URLs for both development and production

### Current Limitations

- Google sign-in is currently optimized for web platforms
- Mobile Google sign-in requires additional setup with `expo-auth-session`
- Facebook and Apple sign-in are placeholders for future implementation

## Project Structure

```
app/
├── (auth)/                 # Authentication screens
│   ├── sign-in.tsx
│   ├── sign-up.tsx
│   ├── forgot-password.tsx
│   └── oauth-callback.tsx
├── (tabs)/                 # Main app screens
│   ├── index.tsx          # Dashboard
│   ├── tasks.tsx          # Task management
│   ├── habits.tsx         # Habit tracking
│   ├── calendar.tsx       # Calendar view
│   ├── pomodoro.tsx       # Pomodoro timer
│   ├── matrix.tsx         # Priority matrix
│   └── settings.tsx       # App settings
├── _layout.tsx            # Root layout
└── index.tsx              # Entry point

components/                 # Reusable components
├── Toast.tsx
├── LoadingOverlay.tsx
└── GoogleSignInButton.tsx

hooks/                     # Custom hooks
├── useAuth.ts
├── useToast.ts
└── useFrameworkReady.ts

lib/                       # External service configurations
└── supabase.ts

store/                     # Redux store and slices
├── index.ts
└── slices/
    ├── tasksSlice.ts
    ├── habitsSlice.ts
    ├── pomodoroSlice.ts
    ├── themeSlice.ts
    └── preferencesSlice.ts
```

## Technologies Used

- **Framework**: Expo (React Native)
- **Navigation**: Expo Router
- **State Management**: Redux Toolkit
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **UI Components**: React Native Paper
- **Icons**: Lucide React Native
- **Styling**: StyleSheet (React Native)

## Development

### Running the App

```bash
# Start development server
npm run dev

# Build for web
npm run build:web

# Lint code
npm run lint
```

### Environment Variables

Required environment variables:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@nowdo.app or create an issue in the repository.