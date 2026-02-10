# Ice Delivery Mobile (TypeScript)

Clean Expo/React Native rewrite of the Ice Delivery mobile app.

This app is currently API-driven and uses React Query for server state, React Hook Form + Zod for forms/validation, and secure token storage for auth sessions.

## Tech Stack

- Expo + React Native + Expo Router
- TypeScript
- TanStack React Query
- React Hook Form + Zod
- `expo-secure-store` for auth token persistence
- `@react-native-community/datetimepicker`

## Features Implemented

- Authenticated app shell with login guard
- Home page for today’s deliveries
  - Delivery cards with pickup/completion UX
  - Daily count summary (coolers/add-ons)
- All Deliveries page
  - Search
  - Week filter
  - Tip report modal with selectable date range
  - Edit/Delete actions
- Tomorrow’s Deliveries page
  - Defaults to tomorrow
  - User-selectable start/end date range
  - Shared count summary component
- Add Delivery form
  - React Hook Form + Zod
  - Date pickers
  - Neighborhood auto-detection from address
- Edit Delivery form
  - Same dropdown and date behavior as Add form

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Run the app

```bash
npm run start
```

Use Expo CLI options to open on iOS simulator, Android emulator, or Expo Go.

## Scripts

- `npm run start` - start Expo
- `npm run ios` - run on iOS simulator
- `npm run android` - run on Android emulator/device
- `npm run web` - run web target
- `npm run lint` - run Expo ESLint config

## Project Structure

- `app/` - routes/screens (Expo Router)
- `api/` - endpoints, HTTP client, React Query hooks
- `auth/` - session provider, token storage, auth response parsing
- `components/` - reusable UI
- `features/` - domain logic/utilities (deliveries, neighborhoods, date helpers)
- `hooks/` - shared hooks
- `providers/` - app-level providers
