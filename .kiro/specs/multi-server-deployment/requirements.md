# Requirements Document

## Introduction

This feature splits the Face Recognition Attendance System into two separate server deployments:
1. **Admin Server** - Exclusively for admin users (management, user administration, system configuration)
2. **Student/Mentor Server** - For students and mentors (attendance, face enrollment, schedule viewing)

Additionally, this feature migrates token storage from localStorage to HTTP-only cookies for improved security.

Both servers share the same database but run independently, with role-based access control enforced at login time.

## Glossary

- **Admin_Server**: The FastAPI server instance that only accepts admin user logins and provides administrative functionality
- **Student_Mentor_Server**: The FastAPI server instance that only accepts student and mentor logins and provides operational functionality
- **Role_Gate**: Login-time validation that restricts which user roles can authenticate on each server
- **Server_Mode**: Environment variable that determines which server type is running (ADMIN or USER)
- **Admin_Interface**: The frontend UI with visual distinction (different theme/branding) for admin users
- **HTTP_Only_Cookie**: A cookie that cannot be accessed by JavaScript, providing XSS protection
- **Access_Token_Cookie**: HTTP-only cookie storing the JWT access token
- **Refresh_Token_Cookie**: HTTP-only cookie storing the JWT refresh token

## Requirements

### Requirement 1: Server Mode Configuration

**User Story:** As a system administrator, I want to configure which server mode to run, so that I can deploy separate admin and user servers.

#### Acceptance Criteria

1. THE System SHALL support a SERVER_MODE environment variable with values "ADMIN" or "USER"
2. WHEN SERVER_MODE is not set, THE System SHALL default to "USER" mode
3. THE Admin_Server SHALL run on a configurable port (default 8001)
4. THE Student_Mentor_Server SHALL run on a configurable port (default 8000)

### Requirement 2: Role-Based Login Restriction

**User Story:** As a security administrator, I want login restricted by server type, so that admins and users are separated.

#### Acceptance Criteria

1. WHEN a user attempts to login on Admin_Server, THE Role_Gate SHALL only allow users with role "admin"
2. WHEN a user attempts to login on Student_Mentor_Server, THE Role_Gate SHALL only allow users with role "student" or "mentor"
3. WHEN a user with incorrect role attempts login, THE System SHALL return HTTP 403 with message "Access denied for this server"
4. WHEN a valid user logs in on the correct server, THE System SHALL return normal login response with tokens in cookies

### Requirement 3: API Route Filtering

**User Story:** As a developer, I want each server to only expose relevant API routes, so that the attack surface is minimized.

#### Acceptance Criteria

1. THE Admin_Server SHALL expose: auth routes, user management routes, API key management routes, stats routes
2. THE Admin_Server SHALL NOT expose: face enrollment routes, attendance marking routes
3. THE Student_Mentor_Server SHALL expose: auth routes (login/profile only), schedule routes, attendance routes, AI/face routes, notification routes
4. THE Student_Mentor_Server SHALL NOT expose: user management routes, API key management routes

### Requirement 4: Admin Interface Visual Distinction

**User Story:** As an admin user, I want a visually distinct interface, so that I can easily identify I'm on the admin system.

#### Acceptance Criteria

1. WHEN running in admin mode, THE Frontend SHALL display an "Admin Portal" header/badge
2. THE Admin_Interface SHALL use a distinct color scheme (e.g., darker theme with red/orange accents)
3. THE Admin_Interface SHALL show "Admin Server" indicator in the sidebar
4. THE Login page SHALL display "Admin Login" title when connecting to Admin_Server

### Requirement 5: Frontend Server Detection

**User Story:** As a frontend developer, I want the UI to detect which server it's connected to, so that it can adapt accordingly.

#### Acceptance Criteria

1. THE Frontend SHALL call a /api/server-info endpoint on startup
2. THE Server_Info endpoint SHALL return server_mode ("ADMIN" or "USER") and server_name
3. WHEN server_mode is "ADMIN", THE Frontend SHALL apply admin theme and show admin-only navigation
4. WHEN server_mode is "USER", THE Frontend SHALL apply standard theme and hide admin-only features

### Requirement 6: Shared Database Access

**User Story:** As a system architect, I want both servers to share the same database, so that data remains consistent.

#### Acceptance Criteria

1. THE Admin_Server and Student_Mentor_Server SHALL use the same DATABASE_URL
2. WHEN an admin creates a user on Admin_Server, THE User SHALL be immediately available on Student_Mentor_Server
3. WHEN attendance is marked on Student_Mentor_Server, THE Stats SHALL be immediately visible on Admin_Server

### Requirement 7: Cookie-Based Token Storage

**User Story:** As a security engineer, I want tokens stored in HTTP-only cookies instead of localStorage, so that the system is protected against XSS attacks.

#### Acceptance Criteria

1. WHEN a user successfully logs in, THE Backend SHALL set access_token as an HTTP-only cookie
2. WHEN a user successfully logs in, THE Backend SHALL set refresh_token as an HTTP-only cookie with path "/api/auth/refresh"
3. THE Access_Token_Cookie SHALL have httpOnly=true, secure=true (in production), sameSite="lax"
4. THE Frontend SHALL NOT store tokens in localStorage or sessionStorage
5. THE Frontend SHALL send requests with credentials: "include" to attach cookies automatically
6. WHEN a user logs out, THE Backend SHALL clear both token cookies by setting them to expire immediately
7. THE Backend SHALL read the access token from cookies instead of Authorization header

### Requirement 8: Cookie Security Configuration

**User Story:** As a security administrator, I want cookie security settings configurable, so that I can adjust for different environments.

#### Acceptance Criteria

1. THE System SHALL support COOKIE_SECURE environment variable (default: true in production, false in development)
2. THE System SHALL support COOKIE_SAMESITE environment variable (default: "lax")
3. THE System SHALL support COOKIE_DOMAIN environment variable for cross-subdomain cookies
4. WHEN COOKIE_SECURE is true, THE Cookies SHALL only be sent over HTTPS

### Requirement 9: Remember Me Feature (Student/Mentor Only)

**User Story:** As a student or mentor, I want a "Remember Me" option that saves my credentials, so that I don't have to re-enter them each time.

#### Acceptance Criteria

1. THE Student_Mentor_Server login page SHALL display a "Remember Me" checkbox
2. WHEN "Remember Me" is checked and login succeeds, THE System SHALL store email in a non-HTTP-only cookie (readable by frontend)
3. WHEN "Remember Me" is checked and login succeeds, THE System SHALL store encrypted password in a non-HTTP-only cookie
4. THE Remember_Me cookies SHALL expire after 30 days
5. WHEN the login page loads with Remember_Me cookies, THE Frontend SHALL pre-fill the email and password fields
6. THE Admin_Server login page SHALL NOT display the "Remember Me" option
7. WHEN a user unchecks "Remember Me" and logs in, THE System SHALL clear any existing Remember_Me cookies

### Requirement 10: Complete localStorage Migration

**User Story:** As a developer, I want all localStorage usage replaced with cookies, so that the application has consistent storage strategy.

#### Acceptance Criteria

1. THE Frontend SHALL NOT use localStorage for any authentication data
2. THE Frontend SHALL NOT use sessionStorage for any authentication data
3. THE User object SHALL be stored in a non-HTTP-only cookie (for frontend access)
4. THE Theme preference SHALL be stored in a cookie instead of localStorage
5. WHEN migrating, THE System SHALL clear any legacy localStorage data on first load
