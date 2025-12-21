# Design Document: E2E Testing Suite

## Overview

This design document outlines the architecture and implementation approach for a comprehensive End-to-End (E2E) testing suite for the Face Recognition Attendance System. The suite uses Playwright for browser automation and follows the Page Object pattern for maintainability. Tests will be located in the `others/e2e-tests` folder at the project root.

## Architecture

```
others/
└── e2e-tests/
    ├── playwright.config.ts      # Playwright configuration
    ├── package.json              # Test dependencies
    ├── tsconfig.json             # TypeScript config
    ├── fixtures/
    │   ├── auth.fixture.ts       # Authentication fixtures
    │   └── test-data.ts          # Test user credentials
    ├── pages/
    │   ├── base.page.ts          # Base page object
    │   ├── login.page.ts         # Login page object
    │   ├── dashboard.page.ts     # Dashboard page object
    │   ├── courses.page.ts       # Courses page object
    │   ├── classes.page.ts       # Classes page object
    │   ├── schedule.page.ts      # Schedule page object
    │   ├── attendance.page.ts    # Attendance page object
    │   ├── enrollments.page.ts   # Enrollments page object
    │   ├── notifications.page.ts # Notifications page object
    │   ├── profile.page.ts       # Profile page object
    │   └── face-enrollment.page.ts # Face enrollment page object
    ├── tests/
    │   ├── auth.spec.ts          # Authentication tests
    │   ├── navigation.spec.ts    # Navigation tests
    │   ├── dashboard.spec.ts     # Dashboard tests
    │   ├── courses.spec.ts       # Courses tests
    │   ├── schedule.spec.ts      # Schedule tests
    │   ├── attendance.spec.ts    # Attendance tests
    │   ├── enrollments.spec.ts   # Enrollments tests
    │   ├── notifications.spec.ts # Notifications tests
    │   ├── profile.spec.ts       # Profile tests
    │   └── error-handling.spec.ts # Error handling tests
    └── utils/
        ├── helpers.ts            # Test helper functions
        └── api-mock.ts           # API mocking utilities
```

## Components and Interfaces

### 1. Playwright Configuration

```typescript
// playwright.config.ts
interface PlaywrightConfig {
  baseURL: string;           // Frontend URL (http://localhost:3000)
  testDir: string;           // ./tests
  timeout: number;           // 30000ms per test
  retries: number;           // 2 retries on CI
  workers: number;           // Parallel workers
  reporter: string[];        // ['html', 'list']
  use: {
    trace: string;           // 'on-first-retry'
    screenshot: string;      // 'only-on-failure'
    video: string;           // 'retain-on-failure'
  };
  projects: Project[];       // Browser configurations
}
```

### 2. Base Page Object

```typescript
// pages/base.page.ts
interface BasePage {
  page: Page;
  goto(path: string): Promise<void>;
  waitForLoad(): Promise<void>;
  getToastMessage(): Promise<string>;
  dismissToast(): Promise<void>;
  isLoggedIn(): Promise<boolean>;
}
```

### 3. Authentication Fixture

```typescript
// fixtures/auth.fixture.ts
interface AuthFixture {
  studentPage: Page;    // Pre-authenticated as student
  mentorPage: Page;     // Pre-authenticated as mentor
  adminPage: Page;      // Pre-authenticated as admin
  unauthPage: Page;     // Not authenticated
}
```

### 4. Test Data

```typescript
// fixtures/test-data.ts
interface TestUsers {
  student: { email: string; password: string; name: string };
  mentor: { email: string; password: string; name: string };
  admin: { email: string; password: string; name: string };
}
```

## Data Models

### Test User Credentials
Based on the seeded data from production-readiness spec:
- Admin: `admin@school.edu` / `Test123!`
- Mentor: `mentor1@school.edu` / `Test123!`
- Student: `student1@school.edu` / `Test123!`

### Page Routes
| Route | Page | Roles |
|-------|------|-------|
| `/` | Landing | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/dashboard` | Dashboard | All authenticated |
| `/courses` | Courses | All authenticated |
| `/classes` | Classes | All authenticated |
| `/schedule` | Schedule | All authenticated |
| `/attendance` | Attendance | All authenticated |
| `/enrollments` | Enrollments | Mentor, Admin |
| `/notifications` | Notifications | All authenticated |
| `/profile` | Profile | All authenticated |
| `/face-enrollment` | Face Enrollment | Student |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid credentials result in successful login
*For any* valid user credentials (student, mentor, or admin), submitting them on the login page SHALL result in successful authentication and redirect to the dashboard.
**Validates: Requirements 1.1**

### Property 2: Invalid credentials show error without reload
*For any* invalid credential combination, submitting them on the login page SHALL display an error message and the page SHALL NOT reload (URL remains `/login`).
**Validates: Requirements 1.2**

### Property 3: Protected routes redirect unauthenticated users
*For any* protected route (dashboard, courses, classes, schedule, attendance, enrollments, notifications, profile, face-enrollment), accessing it without authentication SHALL redirect to the login page.
**Validates: Requirements 2.3**

### Property 4: Sidebar navigation loads correct pages
*For any* sidebar menu item clicked by an authenticated user, the corresponding page SHALL load with the correct URL and page content.
**Validates: Requirements 2.1**

### Property 5: Role-specific menu items display correctly
*For any* authenticated user role, the sidebar SHALL display only the menu items appropriate for that role.
**Validates: Requirements 2.4**

### Property 6: Role-specific dashboard data displays correctly
*For any* authenticated user role, the dashboard SHALL display statistics and data appropriate for that role (student sees attendance rate, mentor sees classes taught, admin sees system-wide stats).
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 7: Search/filter updates results correctly
*For any* search query or filter applied on courses/classes pages, the displayed results SHALL update to match the filter criteria.
**Validates: Requirements 4.4**

### Property 8: Form validation prevents empty submissions
*For any* form in the application (login, profile update, enrollment), submitting with empty required fields SHALL display validation error messages.
**Validates: Requirements 11.3**

## Error Handling

### Network Errors
- Tests will verify loading indicators appear during slow network conditions
- Tests will verify user-friendly error messages display when API calls fail
- Tests will use Playwright's route interception to simulate network failures

### Authentication Errors
- Tests will verify proper error messages for invalid credentials
- Tests will verify session expiration redirects to login
- Tests will verify unauthorized access attempts are blocked

### Form Validation Errors
- Tests will verify client-side validation messages display
- Tests will verify form state is preserved on validation failure

## Testing Strategy

### Test Framework
- **Playwright**: Modern browser automation with excellent TypeScript support
- **@playwright/test**: Built-in test runner with parallel execution

### Test Organization

#### Unit-like E2E Tests (Examples)
These test specific scenarios:
- Logout confirmation dialog flow
- Session expiration redirect
- Specific role dashboard views
- Attendance session start/end
- Enrollment add/remove
- Notification dismiss

#### Property-Based E2E Tests
These test properties across multiple inputs:
- Valid/invalid credential combinations
- Protected route access
- Navigation across all menu items
- Search/filter functionality
- Form validation across all forms

### Test Execution
```bash
# Run all tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/auth.spec.ts

# Run with UI mode
npm run test:e2e:ui

# Run headed (visible browser)
npm run test:e2e:headed

# Generate report
npm run test:e2e:report
```

### Authentication Strategy
- Use Playwright's `storageState` to save and reuse authentication
- Create auth fixtures for each role (student, mentor, admin)
- Tests requiring authentication will use pre-authenticated fixtures
- This speeds up test execution by avoiding repeated logins

### Parallel Execution
- Tests are designed to be independent and run in parallel
- Each test file can run in its own worker
- Shared state is avoided to prevent flaky tests

### Reporting
- HTML report with screenshots of failures
- Video recording on failure for debugging
- Trace files for step-by-step debugging

### Property-Based Testing Library
For property-based tests within E2E context, we'll use **fast-check** integrated with Playwright:
- Generate random valid/invalid credentials
- Generate random navigation sequences
- Generate random search queries
- Minimum 100 iterations per property test

### Test Annotations
Each property-based test will be annotated with:
```typescript
/**
 * Feature: e2e-testing, Property 1: Valid credentials result in successful login
 * Validates: Requirements 1.1
 */
```

