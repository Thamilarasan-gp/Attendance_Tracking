# Placement Attendance Mobile App

React Native Expo SDK 54 frontend for Placement Attendance Manager.

## Run

```bash
npm install
npm start
```

Open the QR code in Expo Go.

## API

The app uses:

```js
export const API_BASE_URL =
  "https://attendance-tracking-zeta-sooty.vercel.app";
```

Configured in:

```text
src/constants/config.js
```

## Features

- Register and login
- Persistent login with AsyncStorage
- Logout
- Dashboard class list
- Create class
- Add, edit, delete, search students
- Import students from Excel
- Attendance marking with single tap and double tap
- Attendance reset
- Present, OD, absent sections
- Copy roll numbers
- Copy WhatsApp report
- Call absent students
- Socket.IO real-time updates
