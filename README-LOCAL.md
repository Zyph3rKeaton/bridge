# Bridge Scoring App - Local Development

## ✅ **CURRENTLY RUNNING & WORKING**

### 🎯 **App Status**
- **Frontend**: http://localhost:3000 ✅ Running
- **Backend**: http://localhost:4000 ✅ Running  
- **Database**: SQLite with demo data ✅ Working
- **API**: All endpoints functional ✅ Working

### 🚀 **Quick Access**
**Open in browser**: http://localhost:3000

### 🎨 **Features Available**
- ✅ **Home Page** - Navigation to all features
- ✅ **Events List** - View demo session (24 boards, 12 pairs)
- ✅ **New Session** - Create duplicate bridge sessions
- ✅ **Board Entry** - Enter contracts, calculate scores with vulnerability
- ✅ **Board Selector** - Choose from 24 boards with different vulnerability settings
- ✅ **Results Page** - View formatted results like official bridge results
- ✅ **Scoring Engine** - Duplicate bridge calculations with proper vulnerability
- ✅ **Responsive Design** - Large touch targets, accessible

### 🧮 **Scoring Examples Tested**
- **4 Hearts by South, 10 tricks** → Score: 420 (game bonus, non-vulnerable)
- **4 Hearts by South, 10 tricks** → Score: 620 (game bonus, vulnerable)
- **3NT by North, 9 tricks** → Score: 400 (game bonus, non-vulnerable)
- **3NT by North, 9 tricks** → Score: 600 (game bonus, vulnerable)

### 📊 **Results Format**
The results page displays:
- **Final Standings** - N/S and E/W pair rankings with points and percentages
- **Board Results** - Detailed results for each board in official bridge format
- **Vulnerability Display** - Shows vulnerability for each board
- **Contract Details** - Level, strain, doubled/redoubled, declarer, tricks made/down
- **Score Calculation** - Proper N/S and E/W point allocation

### 🎯 **Vulnerability System**
- **Board 1**: Neither vulnerable
- **Board 2**: N/S vulnerable  
- **Board 3**: E/W vulnerable
- **Board 4**: Both vulnerable
- **Pattern repeats** every 4 boards
- **Vulnerability only applies** to the team that got the bid (declarer's team)

### 🌐 **API Endpoints Working**
- ✅ `GET /api/health` - Health check
- ✅ `GET /api/events` - List all events
- ✅ `GET /api/events/:id/boards` - List boards for event
- ✅ `POST /api/results` - Create result and calculate score
- ✅ `GET /api/results/events/:eventId` - Get all results for event
- ✅ `GET /api/events/:id/rankings/pairs` - Calculate matchpoints

### 🎯 **Grandma-Friendly Features**
- ✅ **Large Buttons** (56px minimum)
- ✅ **High Contrast** colors (teal, saffron, warm grays)
- ✅ **Plain Language** labels
- ✅ **Keyboard Navigation** support
- ✅ **Offline Capability** with service worker
- ✅ **Accessible Design** with ARIA labels
- ✅ **Clear Vulnerability Display** - Shows when declarer is vulnerable
- ✅ **Professional Results Format** - Matches official bridge result sheets

## Duplicate-Only Scope
This app implements duplicate bridge scoring (Pairs/Teams). Party/Chicago/Rubber modes are out of scope for this build.

## Scan Workflow (Duplicate Sheets)
1. Open the app at http://localhost:3000 and go to Events → Boards.
2. Click Scan on a specific board or open /scan and upload a photo.
3. Review parsed rows (board, pairs, contract, dbl/rdbl, declarer, tricks made/down).
4. Click Import to bulk save; view summary and verify on Results.

## Desktop (macOS DMG)
A minimal Electron wrapper is provided to run the PWA in a desktop window.

Build steps:
- Dev: start backend and frontend, then run:
  - `cd apps/electron && npm install`
  - `npm run start` (opens http://localhost:3000 in a desktop window)
- DMG: `npm run build` inside `apps/electron` (requires code signing settings for distribution).

## 🔧 **Environment Setup**

The app is configured with:
- **Frontend**: Next.js 14 PWA with Tailwind CSS
- **Backend**: NestJS with Prisma ORM
- **Database**: SQLite (file: `apps/backend/dev.db`)
- **Environment**: `apps/frontend/.env.local` with API URL

### 📱 **Perfect for Tablets**
- Touch-friendly interface
- Large, clear buttons
- Easy contract entry
- Real-time score calculation
- Offline capability for club environments
- Board selector for different vulnerability scenarios
- Professional results display

## 🎉 **Ready for Production Use**

The bridge scoring app is fully functional and ready for bridge clubs to use!

**Try it now**: Open http://localhost:3000 and start scoring bridge games! 🃏 