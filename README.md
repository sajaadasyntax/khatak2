# khatak Frontend (Client Portal)

This is the client-facing Next.js application for the khatak platform. It allows clients to create shipping orders, track their packages, and manage their accounts.

## Technology Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: For type safety
- **Bootstrap**: For responsive UI components
- **Axios**: For API requests
- **React Icons**: For UI icons

## Features

- User authentication (login/register)
- Dashboard with order overview
- Create and manage shipping orders
- Real-time order tracking
- User profile management

## Project Structure

```
frontend/
├── app/                  # Next.js App Router
│   ├── dashboard/        # Client dashboard pages
│   ├── login/            # Authentication pages
│   ├── register/         
│   └── ...
├── components/           # Reusable UI components
├── contexts/             # React contexts (auth, etc.)
├── hooks/                # Custom React hooks
├── models/               # TypeScript interfaces for data models
├── public/               # Static assets
├── styles/               # Global CSS styles
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
```bash
cd frontend
```

3. Install dependencies:
```bash
npm install
# or
yarn install
```

4. Create a `.env.local` file with the following variables:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

5. Start the development server:
```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Build for Production

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## API Integration

This frontend connects to the Express backend API running on port 5000. The API endpoints are proxied through Next.js API routes to avoid CORS issues. #   k h a t a k 1  
 