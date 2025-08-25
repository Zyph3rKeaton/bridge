#!/bin/bash

echo "Setting up Bridge Scoring App for local development..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# Backend
DATABASE_URL=file:./apps/backend/dev.db
REDIS_URL=redis://localhost:6379
JWT_SECRET=devsecret
DEVICE_PIN=1234
PORT=4000

# Frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
EOF
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Setup database
echo "Setting up database..."
cd apps/backend
npx prisma generate
npx prisma db push
npx prisma db seed

echo "Setup complete! To start the app:"
echo "1. Terminal 1: cd apps/backend && npm run start:dev"
echo "2. Terminal 2: cd apps/frontend && npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser" 