# Placement Attendance Manager Backend

Complete Node.js, Express.js, MongoDB Atlas, Mongoose, Socket.IO, bcryptjs, multer, xlsx, cors, and dotenv backend for placement attendance coordination.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
DNS_SERVERS=8.8.8.8,1.1.1.1
```

This workspace already has `.env` configured with the Atlas URL you provided.

3. Start the server:

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

Base URL:

```text
http://localhost:5000
```

## Response Format

Successful responses:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error message"
}
```

## API Endpoints

### Auth

`POST /api/auth/register`

```json
{
  "name": "Thamilarasan",
  "email": "thamil@gmail.com",
  "password": "123456"
}
```

`POST /api/auth/login`

```json
{
  "email": "thamil@gmail.com",
  "password": "123456"
}
```

### Classes

`POST /api/classes`

```json
{
  "name": "IV IT",
  "userId": "USER_ID"
}
```

`GET /api/classes/:userId`

`GET /api/classes/details/:classId`

`PUT /api/classes/:classId`

```json
{
  "name": "Dell IT"
}
```

`DELETE /api/classes/:classId`

Deleting a class also deletes all students in that class.

### Students

`POST /api/classes/:classId/students`

```json
{
  "rollNo": "23IT001",
  "name": "Arun Kumar",
  "phone": "9876543210"
}
```

`GET /api/classes/:classId/students`

`GET /api/classes/:classId/students/search?q=arun`

`PUT /api/students/:studentId`

```json
{
  "rollNo": "23IT001",
  "name": "Arun Kumar",
  "phone": "9876543210"
}
```

`DELETE /api/students/:studentId`

### Excel Import

`POST /api/classes/:classId/import`

Use `form-data` with key `file`.

Supported columns:

```text
Roll No | Name | Phone
```

Duplicate roll numbers in the same class are skipped.

### Attendance

`PATCH /api/students/:studentId/status`

```json
{
  "status": "present"
}
```

Allowed status values:

```text
present
absent
od
```

`POST /api/classes/:classId/reset`

`GET /api/classes/:classId/summary`

`GET /api/classes/:classId/present`

`GET /api/classes/:classId/od`

`GET /api/classes/:classId/absent`

`GET /api/classes/:classId/report`

## Socket.IO

Connect to:

```text
http://localhost:5000
```

Join a class room:

```js
socket.emit("joinClass", { classId });
```

Room format:

```text
class_<classId>
```

Listen for attendance changes:

```js
socket.on("attendanceUpdated", (payload) => {
  console.log(payload);
});

socket.on("attendanceReset", (payload) => {
  console.log(payload);
});

socket.on("summaryUpdated", (payload) => {
  console.log(payload);
});
```

Events are emitted when attendance is updated or reset through the REST API.

## Postman

Import this file into Postman:

```text
postman/Placement_Attendance_Manager.postman_collection.json
```

Set collection variables after each step:

```text
baseUrl = http://localhost:5000
userId = copied registered user _id
classId = copied created class _id
studentId = copied created student _id
```
