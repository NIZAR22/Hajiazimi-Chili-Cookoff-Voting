# Chili Cook-Off Voting System

A Vue.js 3 and Vuetify 3 web application for managing chili cook-off competitions with a Node.js/SQLite backend.

## Features

### 🔐 Admin Panel (Password Protected)
- Secure admin access with session-based authentication
- Manage chili entries with expandable panels
- Live scores table with real-time updates (auto-refreshes every 5 seconds)
- Start/End bonus rounds for tied competitions
- Reset entire competition and clear voting history
- Clean up localStorage when chilis are deleted

### 🗳️ Voting Interface
- **Chili Submission Modal**: First-time visitors submit their own chili entry
- **Comprehensive Scoring**: Rate chilis on 5 criteria (0-10 points each):
  - Aroma
  - Appearance  
  - Taste
  - Heat Level
  - Creativity
- **Smart Navigation**: Auto-advance to next unscored chili
- **Voting History**: Tracks completed votes, prevents duplicate voting
- **Bonus Round**: Additional voting for tied chilis only
- **Auto-Refresh**: Automatically detects when bonus round starts (no manual refresh needed)

### 🏆 Competition Management
- **Tie Detection**: Automatically identifies tied chilis for bonus rounds
- **Final Scoring**: Combines regular votes + bonus points for final rankings
- **Mobile Responsive**: Optimized for phones, tablets, and desktop
- **Real-time Updates**: Both admin and voting pages update automatically

### 💾 Data Persistence
- **Backend**: RESTful API with SQLite database
- **Frontend**: localStorage for voting history and user sessions
- **Smart Cleanup**: Automatic cleanup when admin makes changes

## Project Structure

```
Hajiazimi-Chili-Cookoff-Voting/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   └── styles/
│   │   │       └── main.css
│   │   ├── plugins/
│   │   │   └── vuetify.js
│   │   ├── router/
│   │   │   └── index.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── views/
│   │   │   ├── AdminView.vue
│   │   │   └── VotingView.vue
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── server.js
│   ├── schema.sql
│   ├── init-db.js
│   ├── package.json
│   └── nodemon.json
├── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Hajiazimi-Chili-Cookoff-Voting
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (if needed separately)
cd ../frontend
npm install
```

### 3. Initialize Database
```bash
cd backend
node init-db.js
```

## Running the Application

### Development Mode (Recommended)
From the root directory, run both frontend and backend:
```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:3005 (Node.js API server)

### Manual Startup
If you prefer to run them separately:

**Backend Server:**
```bash
cd backend
npm run dev
# or: node server.js
```

**Frontend Server:**
```bash
cd frontend
npm run dev
```

## Usage

### For Participants:
1. Visit the voting page (default route)
2. Submit your chili entry in the modal (first visit)
3. Score chilis on all 5 criteria (0-10 points each)
4. Wait for bonus round notification (automatic)
5. Submit bonus votes for tied chilis

### For Administrators:
1. Navigate to `/admin`
2. Enter admin password (change in `AdminView.vue`)
3. Set up competition chilis
4. Monitor live scores (auto-refreshing)
5. Start bonus round when ready
6. End bonus round to finalize results

## Configuration

### Admin Password
Update the admin password in `frontend/src/views/AdminView.vue`:
```javascript
adminPassword: "yourNewPassword", // Change this
```

### API Endpoints
The frontend connects to the backend API at `http://localhost:3005` by default.
Update `frontend/src/services/api.js` if needed.

## Features in Detail

### Bonus Round System
- Automatically detects tied chilis based on average scores
- Only tied chilis appear in bonus voting
- Participants get 10 bonus points to distribute
- Final scores = Average Score + Bonus Points

### Auto-Refresh Technology  
- Admin panel: Live scores update every 5 seconds
- Voting page: Detects bonus round activation automatically
- No manual page refreshes needed during competition

### Mobile Optimization
- Responsive Vuetify components
- Touch-friendly interface
- Optimized button layouts for small screens
- Progressive enhancement for larger screens

## License

This project is licensed under the MIT License.