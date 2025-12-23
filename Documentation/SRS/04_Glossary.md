# Glossary

## 4.1 Technical Terms

| Term | Definition |
|------|------------|
| **API** | Application Programming Interface - A set of protocols for building software applications |
| **Authentication** | The process of verifying the identity of a user |
| **Authorization** | The process of determining what actions a user is permitted to perform |
| **Backend** | Server-side application logic and database management |
| **Cache** | Temporary storage for frequently accessed data to improve performance |
| **CORS** | Cross-Origin Resource Sharing - Security mechanism for web browsers |
| **CRUD** | Create, Read, Update, Delete - Basic database operations |
| **Endpoint** | A specific URL where an API can be accessed |
| **Frontend** | Client-side user interface of an application |
| **HTTP** | Hypertext Transfer Protocol - Foundation of data communication on the web |
| **JSON** | JavaScript Object Notation - Lightweight data interchange format |
| **JWT** | JSON Web Token - Compact, URL-safe means of representing claims |
| **Middleware** | Software that acts as a bridge between an operating system and applications |
| **ORM** | Object-Relational Mapping - Technique for converting data between systems |
| **REST** | Representational State Transfer - Architectural style for web services |
| **WebSocket** | Protocol providing full-duplex communication channels over TCP |

## 4.2 Face Recognition Terms

| Term | Definition |
|------|------------|
| **Centroid** | The average (center point) of all face embeddings for a user |
| **Confidence Score** | A numerical value (0-1) indicating recognition certainty |
| **Embedding** | A numerical vector representation of a face (512 dimensions) |
| **Encoding** | The process of converting a face image to a numerical vector |
| **Face Detection** | Identifying the location of faces in an image |
| **Face Recognition** | Identifying whose face is detected by comparing embeddings |
| **InsightFace** | Open-source face analysis library used for recognition |
| **Liveness Detection** | Determining if a face is from a live person vs photo/video |
| **LBP** | Local Binary Pattern - Texture analysis technique for liveness |
| **Moiré Pattern** | Visual interference pattern indicating screen display |
| **Pose Classification** | Categorizing face orientation (front, left, right, up, down) |
| **Quality Score** | Metric measuring image quality (sharpness, lighting, size) |
| **Threshold** | Minimum confidence score required for positive recognition |
 
## 4.3 System-Specific Terms

| Term | Definition |
|------|------------|
| **Attendance Record** | A single entry marking a student's attendance status |
| **Attendance Session** | A time-bounded period during which attendance is tracked |
| **Class** | A scheduled meeting of a course at a specific time and place |
| **Course** | An academic subject that may have multiple classes |
| **Edge Agent** | Camera-connected software that captures and sends frames |
| **Enrollment** | The process of registering a student's face in the system |
| **Mentor** | A teacher or instructor who manages classes |
| **Session State** | Current status of attendance session (inactive/active/completed) |
| **Student ID** | Unique identifier for a student (format: YYYY/NNNNN) |

## 4.4 User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Student** | Learner enrolled in classes | View own attendance, schedule, notifications; Enroll face |
| **Mentor** | Teacher/Instructor | Start/end sessions, mark attendance, view class reports |
| **Admin** | System Administrator | Full access to all features, user management, system config |

## 4.5 Attendance Statuses

| Status | Description |
|--------|-------------|
| **Present** | Student attended the class on time |
| **Absent** | Student did not attend the class |
| **Late** | Student attended but arrived after the session started |
| **Excused** | Student absence is excused (manual override) |

## 4.6 Session States

| State | Description |
|-------|-------------|
| **Inactive** | Session has not started yet |
| **Active** | Session is currently in progress, attendance can be marked |
| **Completed** | Session has ended, no more attendance changes allowed |

## 4.7 Design Patterns Used

| Pattern | Description | Usage in System |
|---------|-------------|-----------------|
| **Repository** | Abstracts data access logic | All database operations |
| **Strategy** | Defines family of algorithms | Authentication (JWT/API Key) |
| **State** | Object behavior changes with state | Attendance session management |
| **Factory** | Creates objects without specifying class | Notification creation |
| **Observer** | Notifies dependents of state changes | WebSocket notifications |
| **Adapter** | Converts interface to another | Face recognition library integration |
| **Singleton** | Ensures single instance | Database connection, cache manager |

## 4.8 Abbreviations

| Abbreviation | Full Form |
|--------------|-----------|
| AI | Artificial Intelligence |
| API | Application Programming Interface |
| CSS | Cascading Style Sheets |
| DB | Database |
| E2E | End-to-End |
| HTML | HyperText Markup Language |
| ID | Identifier |
| ML | Machine Learning |
| MVC | Model-View-Controller |
| PDF | Portable Document Format |
| RBAC | Role-Based Access Control |
| SQL | Structured Query Language |
| UI | User Interface |
| URL | Uniform Resource Locator |
| UUID | Universally Unique Identifier |
| UX | User Experience |
| WS | WebSocket |
