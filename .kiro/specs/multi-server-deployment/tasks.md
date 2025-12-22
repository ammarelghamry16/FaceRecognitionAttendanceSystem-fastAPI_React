# Implementation Plan: Multi-Server Deployment with Cookie Authentication

## Overview

This implementation plan covers splitting the system into Admin and Student/Mentor servers while migrating from localStorage to HTTP-only cookies for authentication.

## Tasks

- [x] 1. Create Server Configuration Module
  - [x] 1.1 Create `FastAPI/shared/config/server_config.py` with ServerMode enum and ServerConfig class
    - Define SERVER_MODE, SERVER_PORT, COOKIE_SECURE, COOKIE_SAMESITE, COOKIE_DOMAIN settings
    - Implement `get_server_config()` function
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.1, 8.2, 8.3_
  - [x] 1.2 Write property test for server mode default
    - **Property 7: Server Mode Configuration Default**
    - **Validates: Requirements 1.2**

- [x] 2. Implement Cookie Service
  - [x] 2.1 Create `FastAPI/services/auth_service/services/cookie_service.py`
    - Implement `set_auth_cookies()` for access_token and refresh_token
    - Implement `set_user_cookie()` for frontend-readable user data
    - Implement `set_remember_me_cookies()` with encryption
    - Implement `clear_auth_cookies()` and `clear_remember_me_cookies()`
    - _Requirements: 7.1, 7.2, 7.3, 9.2, 9.3, 9.4_
  - [x] 2.2 Write property test for auth cookie attributes
    - **Property 2: Auth Cookie Attributes**
    - **Validates: Requirements 7.1, 7.2, 7.3, 10.3**
  - [x] 2.3 Write property test for remember me cookie behavior
    - **Property 5: Remember Me Cookie Behavior**
    - **Validates: Requirements 9.2, 9.3, 9.4, 9.7**

- [x] 3. Implement Role Gate Middleware
  - [x] 3.1 Create `FastAPI/shared/middleware/role_gate.py`
    - Define ADMIN_ALLOWED_ROLES and USER_ALLOWED_ROLES
    - Implement `validate_role_for_server()` function
    - Implement `get_role_gate_error_message()` function
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 3.2 Write property test for role-server access control
    - **Property 1: Role-Server Access Control**
    - **Validates: Requirements 2.1, 2.2, 2.4**

- [x] 4. Update Auth Service for Cookie-Based Authentication
  - [x] 4.1 Modify `FastAPI/services/auth_service/api/dependencies.py`
    - Add `get_token_from_cookie()` function to extract token from cookies
    - Update `get_current_user()` to use cookie-based token extraction
    - _Requirements: 7.7_
  - [x] 4.2 Modify `FastAPI/services/auth_service/api/routes.py` login endpoint
    - Integrate CookieService for setting auth cookies on successful login
    - Add role gate validation before returning tokens
    - Add remember_me parameter handling (USER server only)
    - Return 403 for wrong role on server
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.1, 7.2, 9.2, 9.3, 9.7_
  - [x] 4.3 Add logout endpoint that clears cookies
    - Create POST /api/auth/logout endpoint
    - Clear all auth cookies using CookieService
    - _Requirements: 7.6_
  - [x] 4.4 Write property test for cookie token extraction
    - **Property 3: Cookie Token Extraction**
    - **Validates: Requirements 7.7**
  - [x] 4.5 Write property test for logout cookie clearing
    - **Property 4: Logout Cookie Clearing**
    - **Validates: Requirements 7.6**

- [x] 5. Update Main Application for Server Mode
  - [x] 5.1 Modify `FastAPI/main.py` for conditional route registration
    - Import server config
    - Register admin-only routes when SERVER_MODE=ADMIN
    - Register user-only routes when SERVER_MODE=USER
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 5.2 Add /api/server-info endpoint
    - Return server_mode, server_name, and features
    - Include remember_me feature flag based on server mode
    - _Requirements: 5.1, 5.2_
  - [x] 5.3 Write property test for server info response format
    - **Property 6: Server Info Response Format**
    - **Validates: Requirements 5.2**

- [x] 6. Checkpoint - Backend Complete
  - Ensure all backend tests pass
  - Verify both server modes work correctly
  - Ask the user if questions arise

- [x] 7. Create Frontend Cookie Utilities
  - [x] 7.1 Create `frontend/my-app/src/utils/cookies.ts`
    - Implement getCookie(), setCookie(), deleteCookie() functions
    - Implement getUser() to parse user from cookie
    - Implement clearLegacyStorage() to remove localStorage data
    - _Requirements: 10.1, 10.2, 10.5_

- [x] 8. Create Server Context
  - [x] 8.1 Create `frontend/my-app/src/context/ServerContext.tsx`
    - Fetch /api/server-info on mount
    - Provide server_mode, server_name, features to children
    - _Requirements: 5.1, 5.3, 5.4_

- [x] 9. Update API Client for Cookies
  - [x] 9.1 Modify `frontend/my-app/src/services/api.ts`
    - Add `withCredentials: true` to axios config
    - Remove Authorization header interceptor
    - Update 401 handler to work with cookies
    - _Requirements: 7.5_

- [x] 10. Update Auth Context for Cookies
  - [x] 10.1 Modify `frontend/my-app/src/context/AuthContext.tsx`
    - Replace localStorage usage with cookie utilities
    - Get user from cookie instead of localStorage
    - Remove token storage logic (backend handles via cookies)
    - Call clearLegacyStorage() on mount
    - _Requirements: 7.4, 10.1, 10.2, 10.5_

- [x] 11. Update Login Page
  - [x] 11.1 Modify `frontend/my-app/src/pages/Login.tsx`
    - Use ServerContext to detect server mode
    - Show "Admin Login" title when server_mode is ADMIN
    - Hide "Remember Me" checkbox when server_mode is ADMIN
    - Pre-fill credentials from remember cookies when available
    - Apply admin theme when server_mode is ADMIN
    - _Requirements: 4.4, 9.1, 9.5, 9.6_

- [x] 12. Update Theme Context for Cookies
  - [x] 12.1 Modify `frontend/my-app/src/context/ThemeContext.tsx`
    - Replace localStorage with cookie for theme preference
    - _Requirements: 10.4_

- [x] 13. Update Sidebar for Server Mode
  - [x] 13.1 Modify `frontend/my-app/src/components/layout/Sidebar.tsx`
    - Use ServerContext to detect server mode
    - Show "Admin Portal" badge when server_mode is ADMIN
    - Apply admin color scheme when server_mode is ADMIN
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 14. Update App.tsx for Server Provider
  - [x] 14.1 Modify `frontend/my-app/src/App.tsx`
    - Wrap app with ServerProvider
    - Add data-server-mode attribute for CSS theming
    - _Requirements: 5.3, 5.4_

- [x] 15. Add Admin Theme CSS
  - [x] 15.1 Modify `frontend/my-app/src/index.css`
    - Add [data-server-mode="ADMIN"] CSS variables
    - Define red/orange accent colors for admin theme
    - _Requirements: 4.2_

- [x] 16. Update Environment Configuration
  - [x] 16.1 Update `FastAPI/.env` with new variables
    - Add SERVER_MODE, SERVER_PORT, COOKIE_SECURE, COOKIE_SAMESITE, COOKIE_DOMAIN
    - _Requirements: 1.1, 8.1, 8.2, 8.3_
  - [x] 16.2 Create `FastAPI/.env.admin` example for admin server
    - Set SERVER_MODE=ADMIN, SERVER_PORT=8001
    - _Requirements: 1.1, 1.3_

- [x] 17. Final Checkpoint
  - All 16 property tests pass
  - Admin server rejects student/mentor login (role gate middleware)
  - User server rejects admin login (role gate middleware)
  - Cookies are set correctly on login (cookie service)
  - Remember me works on user server only (server mode check)

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
