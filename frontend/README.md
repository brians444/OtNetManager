# IP Controller Frontend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure the API URL:
```bash
cp .env.local.example .env.local
# Edit .env.local to set NEXT_PUBLIC_API_URL
```

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

## Features

- Authentication (login/logout)
- Device management (CRUD)
- Credential management per device
- Encrypted password storage
- Responsive UI with Tailwind CSS

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- TanStack Query for data fetching
- shadcn/ui components
- Tailwind CSS
- Axios for API calls
