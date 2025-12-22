# Form-Based and Tabular Specifications

## 11.1 Overview

This section provides detailed specifications for all forms and data tables in the system using a structured tabular format.

---

## 11.2 Form Specifications

### 11.2.1 Login Form

| Form ID | F-AUTH-01 |
|---------|-----------|
| **Form Name** | User Login |
| **Purpose** | Authenticate users to access the system |
| **Access** | Public (unauthenticated users) |

**Form Fields:**

| Field Name | Type | Required | Validation | Default |
|------------|------|----------|------------|---------|
| Email | email | Yes | Valid email format | - |
| Password | password | Yes | Min 8 characters | - |
| Remember Me | checkbox | No | - | false |

**Actions:**

| Button | Action | Validation |
|--------|--------|------------|
| Login | Submit form, authenticate | All required fields filled |
| Forgot Password | Navigate to password reset | - |

**Error Messages:**

| Condition | Message |
|-----------|---------|
| Empty email | "Email is required" |
| Invalid email format | "Please enter a valid email" |
| Empty password | "Password is required" |
| Invalid credentials | "Invalid email or password" |
| Account locked | "Account is locked. Contact administrator" |

---

### 11.2.2 Registration Form

| Form ID | F-AUTH-02 |
|---------|-----------|
| **Form Name** | User Registration |
| **Purpose** | Create new user accounts |
| **Access** | Public |

**Form Fields:**

| Field Name | Type | Required | Validation | Default |
|------------|------|----------|------------|---------|
| Full Name | text | Yes | 2-100 characters | - |
| Email | email | Yes | Valid email, unique | - |
| Password | password | Yes | Min 8 chars, 1 upper, 1 lower, 1 number | - |
| Confirm Password | password | Yes | Must match password | - |

**Actions:**

| Button | Action | Validation |
|--------|--------|------------|
| Register | Create account | All validations pass |
| Back to Login | Navigate to login | - |

---

### 11.2.3 Course Creation Form

| Form ID | F-COURSE-01 |
|---------|-------------|
| **Form Name** | Create Course |
| **Purpose** | Add new courses to the system |
| **Access** | Admin only |

**Form Fields:**

| Field Name | Type | Required | Validation | Default |
|------------|------|----------|------------|---------|
| Course Code | text | Yes | 2-20 chars, unique, alphanumeric | - |
| Course Name | text | Yes | 2-100 characters | - |
| Description | textarea | No | Max 500 characters | - |

**Actions:**

| Button | Action | Validation |
|--------|--------|------------|
| Create | Save course | Code unique, required fields |
| Cancel | Close form | - |

---

### 11.2.4 Class Creation Form

| Form ID | F-CLASS-01 |
|---------|------------|
| **Form Name** | Create Class |
| **Purpose** | Schedule new class sessions |
| **Access** | Admin only |

**Form Fields:**

| Field Name | Type | Required | Validation | Default |
|------------|------|----------|------------|---------|
| Class Name | text | Yes | 2-100 characters | - |
| Course | select | Yes | Must exist | - |
| Mentor | select | Yes | Must be mentor role | - |
| Day of Week | select | Yes | Monday-Sunday | Monday |
| Time | time | Yes | Valid time format | 09:00 |
| Room Number | text | Yes | 1-50 characters | - |

**Actions:**

| Button | Action | Validation |
|--------|--------|------------|
| Create | Save class | No scheduling conflict |
| Cancel | Close form | - |

---

### 11.2.5 User Creation Form

| Form ID | F-USER-01 |
|---------|-----------|
| **Form Name** | Create User |
| **Purpose** | Add new users to the system |
| **Access** | Admin only |

**Form Fields:**

| Field Name | Type | Required | Validation | Default |
|------------|------|----------|------------|---------|
| Full Name | text | Yes | 2-100 characters | - |
| Email | email | Yes | Valid email, unique | - |
| Role | select | Yes | student/mentor/admin | student |
| Student ID | text | Conditional | Required if role=student | Auto-generated |
| Is Active | checkbox | No | - | true |

**Actions:**

| Button | Action | Validation |
|--------|--------|------------|
| Create | Save user | Email unique |
| Cancel | Close form | - |

---

### 11.2.6 Enrollment Form

| Form ID | F-ENROLL-01 |
|---------|-------------|
| **Form Name** | Enroll Student |
| **Purpose** | Add student to a class |
| **Access** | Admin, Mentor |

**Form Fields:**

| Field Name | Type | Required | Validation | Default |
|------------|------|----------|------------|---------|
| Class | select | Yes | Must exist | - |
| Student | autocomplete | Yes | Must be student role | - |

**Actions:**

| Button | Action | Validation |
|--------|--------|------------|
| Enroll | Create enrollment | Not already enrolled |
| Cancel | Close form | - |

---

### 11.2.7 Profile Edit Form

| Form ID | F-PROFILE-01 |
|---------|--------------|
| **Form Name** | Edit Profile |
| **Purpose** | Update user profile information |
| **Access** | Authenticated users |

**Form Fields:**

| Field Name | Type | Required | Validation | Default |
|------------|------|----------|------------|---------|
| Full Name | text | Yes | 2-100 characters | Current value |
| Email | email | Yes | Valid email | Current value (readonly) |

**Actions:**

| Button | Action | Validation |
|--------|--------|------------|
| Save | Update profile | All validations pass |
| Cancel | Discard changes | - |

---

### 11.2.8 Change Password Form

| Form ID | F-PROFILE-02 |
|---------|--------------|
| **Form Name** | Change Password |
| **Purpose** | Update user password |
| **Access** | Authenticated users |

**Form Fields:**

| Field Name | Type | Required | Validation | Default |
|------------|------|----------|------------|---------|
| Current Password | password | Yes | Must match current | - |
| New Password | password | Yes | Min 8 chars, complexity | - |
| Confirm Password | password | Yes | Must match new | - |

**Actions:**

| Button | Action | Validation |
|--------|--------|------------|
| Change Password | Update password | Current password correct |
| Cancel | Close form | - |

---

### 11.2.9 Manual Attendance Form

| Form ID | F-ATT-01 |
|---------|----------|
| **Form Name** | Mark Attendance |
| **Purpose** | Manually mark student attendance |
| **Access** | Mentor |

**Form Fields:**

| Field Name | Type | Required | Validation | Default |
|------------|------|----------|------------|---------|
| Student | display | - | - | Selected student |
| Status | select | Yes | present/absent/late/excused | absent |
| Notes | textarea | No | Max 200 characters | - |

**Actions:**

| Button | Action | Validation |
|--------|--------|------------|
| Save | Update attendance | Session is active |
| Cancel | Close form | - |

---

## 11.3 Data Table Specifications

### 11.3.1 Users Table

| Table ID | T-USER-01 |
|----------|-----------|
| **Table Name** | Users List |
| **Purpose** | Display all system users |
| **Access** | Admin only |

**Columns:**

| Column | Data Type | Sortable | Filterable | Width |
|--------|-----------|----------|------------|-------|
| Name | string | Yes | Yes (search) | 25% |
| Email | string | Yes | Yes (search) | 25% |
| Role | enum | Yes | Yes (dropdown) | 15% |
| Student ID | string | Yes | Yes (search) | 15% |
| Status | boolean | Yes | Yes (dropdown) | 10% |
| Actions | buttons | No | No | 10% |

**Actions per Row:**
- Edit: Open edit form
- Deactivate/Activate: Toggle status
- Reset Password: Send reset email

**Filters:**
- Search: Name, Email, Student ID
- Role: All, Student, Mentor, Admin
- Status: All, Active, Inactive

---

### 11.3.2 Courses Table

| Table ID | T-COURSE-01 |
|----------|-------------|
| **Table Name** | Courses List |
| **Purpose** | Display all courses |
| **Access** | All authenticated users |

**Columns:**

| Column | Data Type | Sortable | Filterable | Width |
|--------|-----------|----------|------------|-------|
| Code | string | Yes | Yes (search) | 15% |
| Name | string | Yes | Yes (search) | 35% |
| Description | string | No | No | 30% |
| Classes | number | Yes | No | 10% |
| Actions | buttons | No | No | 10% |

**Actions per Row (Admin only):**
- Edit: Open edit form
- Delete: Remove course (with confirmation)

---

### 11.3.3 Classes Table

| Table ID | T-CLASS-01 |
|----------|------------|
| **Table Name** | Classes List |
| **Purpose** | Display all classes |
| **Access** | All authenticated users |

**Columns:**

| Column | Data Type | Sortable | Filterable | Width |
|--------|-----------|----------|------------|-------|
| Name | string | Yes | Yes (search) | 20% |
| Course | string | Yes | Yes (dropdown) | 15% |
| Mentor | string | Yes | Yes (dropdown) | 15% |
| Day | enum | Yes | Yes (dropdown) | 10% |
| Time | time | Yes | No | 10% |
| Room | string | Yes | Yes (search) | 10% |
| Students | number | Yes | No | 10% |
| Actions | buttons | No | No | 10% |

---

### 11.3.4 Attendance Records Table

| Table ID | T-ATT-01 |
|----------|----------|
| **Table Name** | Attendance Records |
| **Purpose** | Display attendance history |
| **Access** | Role-based filtering |

**Columns:**

| Column | Data Type | Sortable | Filterable | Width |
|--------|-----------|----------|------------|-------|
| Date | datetime | Yes | Yes (range) | 15% |
| Class | string | Yes | Yes (dropdown) | 20% |
| Student | string | Yes | Yes (search) | 20% |
| Status | enum | Yes | Yes (dropdown) | 15% |
| Method | string | Yes | Yes (dropdown) | 15% |
| Confidence | number | Yes | No | 15% |

**Status Values:**
- Present (green)
- Absent (red)
- Late (yellow)
- Excused (blue)

**Method Values:**
- face_recognition
- manual

---

### 11.3.5 Notifications Table

| Table ID | T-NOT-01 |
|----------|----------|
| **Table Name** | Notifications List |
| **Purpose** | Display user notifications |
| **Access** | Own notifications only |

**Columns:**

| Column | Data Type | Sortable | Filterable | Width |
|--------|-----------|----------|------------|-------|
| Type | enum | No | Yes (dropdown) | 15% |
| Title | string | No | No | 25% |
| Message | string | No | No | 35% |
| Time | datetime | Yes | No | 15% |
| Actions | buttons | No | No | 10% |

**Actions per Row:**
- Mark as Read: Update read status
- Dismiss: Remove notification

---

### 11.3.6 Active Sessions Table

| Table ID | T-SESSION-01 |
|----------|--------------|
| **Table Name** | Active Sessions |
| **Purpose** | Display currently active attendance sessions |
| **Access** | Admin (all), Mentor (own) |

**Columns:**

| Column | Data Type | Sortable | Filterable | Width |
|--------|-----------|----------|------------|-------|
| Class | string | Yes | Yes | 25% |
| Mentor | string | Yes | Yes | 20% |
| Started | datetime | Yes | No | 20% |
| Present | number | No | No | 15% |
| Total | number | No | No | 10% |
| Actions | buttons | No | No | 10% |

**Actions per Row:**
- View: Open session details
- End (Mentor only): End the session

---

## 11.4 Validation Rules Summary

| Rule Type | Description | Example |
|-----------|-------------|---------|
| Required | Field must have a value | Email is required |
| Min Length | Minimum character count | Password min 8 chars |
| Max Length | Maximum character count | Name max 100 chars |
| Pattern | Regex pattern match | Email format |
| Unique | Value must be unique in DB | Email, Course Code |
| Range | Numeric range | Confidence 0-1 |
| Enum | Value from predefined list | Role: student/mentor/admin |
| Match | Must match another field | Confirm password |
| Conditional | Required based on condition | Student ID if role=student |

---

## 11.5 Error Handling

| Error Type | Display Method | Duration |
|------------|----------------|----------|
| Field Validation | Inline below field | Until corrected |
| Form Submission | Toast notification | 5 seconds |
| Server Error | Toast notification | 5 seconds |
| Network Error | Toast notification | Until dismissed |
