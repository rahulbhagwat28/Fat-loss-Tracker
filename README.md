# Connect — Social Media App

A full-stack social app with login, profile photos, feed with comments, friend requests, and messenger-style chat.

## Features

- **Auth**: Register, login, logout (session-based)
- **Profile**: Change profile photo (upload or URL)
- **Feed**: Create posts with photo + caption; comment on posts
- **Friends**: Search users, send/accept/decline friend requests, view friends list
- **Messages**: Chat with friends (messenger-style), conversation list, polling for new messages

## Tech Stack

- **Next.js 14** (App Router)
- **Prisma** + **SQLite**
- **Tailwind CSS**
- **TypeScript**

## Setup

```bash
npm install
npx prisma db push
npm run db:seed   # optional: creates alice@example.com and bob@example.com (password: password123)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up or use seed users to explore.

## Project structure

- `src/app/(app)/` — Authenticated routes: feed, profile, friends, chat
- `src/app/api/` — API routes for auth, posts, comments, friends, messages, upload
- `src/components/` — NavBar, PostCard
- `src/contexts/` — AuthContext
- `prisma/schema.prisma` — Data models (User, Post, Comment, FriendRequest, Friendship, Message)

## Uploads

Profile and post images are stored in `public/uploads/avatar/` and `public/uploads/post/`. Ensure the app can write to `public/uploads/`.
