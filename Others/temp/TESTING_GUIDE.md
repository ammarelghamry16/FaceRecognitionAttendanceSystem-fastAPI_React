# Schedule Service - Testing Guide

## 🚀 Quick Start

### Step 1: Create Database Tables
```bash
cd FastAPI
.\venv\Scripts\activate
python create_tables.py
```

### Step 2: Start Server
```bash
uvicorn main:app --reload
```

### Step 3: Open Swagger UI
Open browser: http://localhost:8000/docs

---

## 📋 Manual Testing Scenarios

### Scenario 1: Create a Course Catalog

**Goal:** Set up courses for the semester

1. **Create CS Course**
   - Endpoint: `POST /api/schedule/courses`
   - Body:
   ```json
   {
     "code": "CS101",
     "name": "Introduction to Computer Science",
     "description": "Learn programming fundamentals"
   }
   ```
   - Expected: 201 Created
   - Save the `id` from response

2. **Create Math Course**
   - Endpoint: `POST /api/schedule/courses`
   - Body:
   ```json
   {
     "code": "MATH101",
     "name": "Calculus I",
     "description": "Introduction to differential calculus"
   }
   ```

3. **View All Courses**
   - Endpoint: `GET /api/schedule/courses`
   - Expected: List of 2 courses

---

### Scenario 2: Schedule Classes

**Goal:** Create class sessions for courses

1. **Create CS101 Section A**
   - Endpoint: `POST /api/schedule/classes`
   - Body:
   ```json
   {
     "course_id": "<CS101_COURSE_ID>",
     "name": "CS101 - Section A",
     "room_number": "A101",
     "day_of_week": "monday",
     "schedule_time": "09:00:00"
   }
   ```
   - Expected: 201 Created

2. **Create CS101 Section B**
   - Endpoint: `POST /api/schedule/classes`
   - Body:
   ```json
   {
     "course_id": "<CS101_COURSE_ID>",
     "name": "CS101 - Section B",
     "room_number": "B202",
     "day_of_week": "wednesday",
     "schedule_time": "14:00:00"
   }
   ```

3. **Create Math Class**
   - Endpoint: `POST /api/schedule/classes`
   - Body:
   ```json
   {
     "course_id": "<MATH101_COURSE_ID>",
     "name": "MATH101 - Section A",
     "room_number": "M301",
     "day_of_week": "tuesday",
     "schedule_time": "10:00:00"
   }
   ```

4. **View All Classes**
   - Endpoint: `GET /api/schedule/classes`
   - Expected: List of 3 classes

---

### Scenario 3: View Schedules

**Goal:** View schedules from different perspectives

1. **View Full Schedule (Admin View)**
   - Endpoint: `GET /api/schedule/schedule/full`
   - Expected: All 3 classes

2. **View Monday Schedule**
   - Endpoint: `GET /api/schedule/schedule/day/monday`
   - Expected: CS101 Section A only

3. **View Wednesday Schedule**
   - Endpoint: `GET /api/schedule/schedule/day/wednesday`
   - Expected: CS101 Section B only

4. **View Room A101 Schedule**
   - Endpoint: `GET /api/schedule/schedule/room/A101`
   - Expected: CS101 Section A only

---

### Scenario 4: Update Information

**Goal:** Modify existing data

1. **Update Course Description**
   - Endpoint: `PUT /api/schedule/courses/{course_id}`
   - Body:
   ```json
   {
     "description": "Updated: Learn programming fundamentals and problem solving"
   }
   ```
   - Expected: 200 OK with updated data

2. **Change Class Room**
   - Endpoint: `PUT /api/schedule/classes/{class_id}`
   - Body:
   ```json
   {
     "room_number": "C303"
   }
   ```
   - Expected: 200 OK with updated room

3. **Change Class Time**
   - Endpoint: `PUT /api/schedule/classes/{class_id}`
   - Body:
   ```json
   {
     "schedule_time": "11:00:00"
   }
   ```

---

### Scenario 5: Delete Data

**Goal:** Remove courses and classes

1. **Delete a Class**
   - Endpoint: `DELETE /api/schedule/classes/{class_id}`
   - Expected: 204 No Content

2. **Verify Deletion**
   - Endpoint: `GET /api/schedule/classes`
   - Expected: Class is gone from list

3. **Delete a Course**
   - Endpoint: `DELETE /api/schedule/courses/{course_id}`
   - Expected: 204 No Content
   - Note: This also deletes all classes for that course (CASCADE)

---

## 🧪 Automated Testing

Run the automated test script:

```bash
# Make sure server is running first!
python test_schedule_service.py
```

This will test all 14 scenarios automatically.

---

## ✅ What to Verify

### After Each Test:

1. **Status Codes**
   - 200 OK - Successful GET/PUT
   - 201 Created - Successful POST
   - 204 No Content - Successful DELETE
   - 400 Bad Request - Validation error
   - 404 Not Found - Resource doesn't exist

2. **Response Data**
   - All fields present
   - UUIDs are valid
   - Timestamps are set
   - Relationships are correct

3. **Database**
   - Data persists after server restart
   - Foreign keys work correctly
   - Cascade deletes work

---

## 🐛 Common Issues & Solutions

### Issue 1: "Course code already exists"
**Solution:** Use a different code or delete the existing course first

### Issue 2: "Course with ID does not exist"
**Solution:** Make sure you're using a valid course_id from a created course

### Issue 3: "Connection refused"
**Solution:** Make sure server is running: `uvicorn main:app --reload`

### Issue 4: "Table doesn't exist"
**Solution:** Run `python create_tables.py` first

---

## 📊 Expected Results Summary

After running all tests, you should have:

- ✅ 2 Courses (CS101, MATH101)
- ✅ 3 Classes (CS101 Section A, CS101 Section B, MATH101 Section A)
- ✅ All CRUD operations working
- ✅ Schedule views working
- ✅ Cascade deletes working

---

## 🎯 Next Steps

Once Schedule Service is tested:

1. **Wait for Auth Service** (teammate develops)
   - Then test enrollment with real users
   - Test role-based schedule views

2. **Wait for Attendance Service** (teammate develops)
   - Then test class activation
   - Test attendance marking

3. **Frontend Integration**
   - Connect React to these APIs
   - Build schedule UI

---

## 📝 Notes

- Enrollment tests require users (Auth Service)
- Mentor assignment requires users (Auth Service)
- For now, test without authentication
- All endpoints work without auth (development mode)

---

**Your Schedule Service is complete and ready for testing! 🎉**
