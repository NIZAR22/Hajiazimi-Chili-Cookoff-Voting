# Chili Cook-Off Voting System

A Vue.js 3 and Vuetify 3 web application for managing chili cook-off competitions with a SQLite backend.

## Features

- **Admin Panel**: Manage chili entries and competition settings
- **Voting Interface**: Score chilis based on multiple criteria:
  - Aroma
  - Appearance
  - Taste
  - Heat Level
  - creativity
- **Backend API**: RESTful API with SQLite database storage
- **Responsive Design**: Works on mobile and desktop devices

## Project Structure

```
Hajiazimi-Chili-Cookoff-Voting
├── src/
│   ├── assets/
│   │   └── images/
│   ├── components/
│   ├── services/
│   │   └── api.js
│   ├── views/
│   │   ├── AdminView.vue
│   │   ├── HomeView.vue
│   │   └── VotingView.vue
│   ├── App.vue
│   └── main.js
├── backend/
│   ├── server.js
│   ├── schema.sql
│   └── .env
├── public/
└── package.json
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install express sqlite3 cors dotenv
```

## Running the Application

To run the application in development mode, use:
```
npm run dev
```

## Running the backend server

1. Navigate to the backend directory:
```
cd backend
```

2. Start the backend server:
```
node server.js
```

3. You should see output like:
```
Server running on port 3000
Connected to SQLite database
```

## License

This project is licensed under the MIT License.