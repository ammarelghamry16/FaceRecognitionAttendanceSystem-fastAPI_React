# Non-Functional Requirements

## 7.1 Overview

This section describes the non-functional requirements that define the quality attributes of the system, including performance, security, usability, and maintainability.

---

## 7.2 Performance Requirements

### NFR-PERF-01: Response Time
THE System SHALL respond to API requests within the following time limits:
- Authentication requests: < 500ms
- Data retrieval requests: < 1 second
- Face recognition requests: < 2 seconds
- Report generation: < 5 seconds

### NFR-PERF-02: Throughput
THE System SHALL support:
- Minimum 100 concurrent users
- Minimum 10 concurrent attendance sessions
- Minimum 50 face recognition requests per minute

### NFR-PERF-03: Real-time Updates
THE System SHALL deliver WebSocket notifications within 1 second of event occurrence.

### NFR-PERF-04: Database Performance
THE System SHALL:
- Use database connection pooling
- Implement query optimization with indexes
- Cache frequently accessed data in Redis

### NFR-PERF-05: Face Recognition Speed
THE System SHALL complete face recognition (detection + matching) within 2 seconds per frame.

---

## 7.3 Security Requirements

### NFR-SEC-01: Authentication
THE System SHALL:
- Use JWT tokens for authentication
- Store tokens in HTTP-only, secure cookies
- Implement token expiration (access: 30 min, refresh: 7 days)

### NFR-SEC-02: Password Security
THE System SHALL:
- Hash passwords using bcrypt with cost factor ≥ 12
- Enforce minimum password length of 8 characters
- Require at least one uppercase, lowercase, and number

### NFR-SEC-03: Data Protection
THE System SHALL:
- Encrypt sensitive data in transit using HTTPS
- Store face encodings securely (not raw images)
- Implement role-based access control (RBAC)

### NFR-SEC-04: Input Validation
THE System SHALL:
- Validate all user inputs on both client and server
- Sanitize inputs to prevent SQL injection
- Implement CSRF protection

### NFR-SEC-05: API Security
THE System SHALL:
- Implement rate limiting (100 requests/minute per user)
- Log all authentication attempts
- Block accounts after 5 failed login attempts

### NFR-SEC-06: Biometric Data Protection
THE System SHALL:
- Store only face encodings, not original images
- Allow users to delete their biometric data
- Encrypt face encodings at rest

---

## 7.4 Usability Requirements

### NFR-USE-01: Accessibility
THE System SHALL:
- Support keyboard navigation
- Provide sufficient color contrast (WCAG 2.1 AA)
- Include alt text for images

### NFR-USE-02: Responsiveness
THE System SHALL:
- Be fully functional on desktop (1024px+)
- Be fully functional on tablet (768px+)
- Be usable on mobile devices (320px+)

### NFR-USE-03: User Feedback
THE System SHALL:
- Display loading indicators for async operations
- Show success/error messages for user actions
- Provide form validation feedback in real-time

### NFR-USE-04: Learnability
THE System SHALL:
- Provide intuitive navigation
- Use consistent UI patterns throughout
- Include guided workflows for complex tasks (face enrollment)

### NFR-USE-05: Theme Support
THE System SHALL support:
- Light theme
- Dark theme
- System preference detection

---

## 7.5 Reliability Requirements

### NFR-REL-01: Availability
THE System SHALL maintain 99% uptime during operational hours.

### NFR-REL-02: Error Handling
THE System SHALL:
- Handle errors gracefully without crashing
- Display user-friendly error messages
- Log detailed error information for debugging

### NFR-REL-03: Data Integrity
THE System SHALL:
- Use database transactions for multi-step operations
- Implement foreign key constraints
- Validate data consistency on write operations

### NFR-REL-04: Recovery
THE System SHALL:
- Support database backup and restore
- Recover from temporary network failures
- Maintain session state across page refreshes

---

## 7.6 Scalability Requirements

### NFR-SCA-01: Horizontal Scaling
THE System architecture SHALL support:
- Multiple backend instances behind a load balancer
- Stateless API design for easy scaling
- Shared session storage (Redis)

### NFR-SCA-02: Database Scaling
THE System SHALL:
- Support read replicas for query distribution
- Use efficient indexing strategies
- Implement query pagination for large datasets

### NFR-SCA-03: Concurrent Sessions
THE System SHALL support multiple concurrent attendance sessions without performance degradation.

---

## 7.7 Maintainability Requirements

### NFR-MNT-01: Code Quality
THE System codebase SHALL:
- Follow consistent coding standards
- Include comprehensive documentation
- Use meaningful variable and function names

### NFR-MNT-02: Modularity
THE System SHALL:
- Use microservices architecture
- Implement separation of concerns
- Use dependency injection for loose coupling

### NFR-MNT-03: Testing
THE System SHALL:
- Have unit test coverage for critical functions
- Include integration tests for API endpoints
- Support end-to-end testing

### NFR-MNT-04: Logging
THE System SHALL:
- Log all significant events
- Include request/response logging for APIs
- Support log level configuration

### NFR-MNT-05: Configuration
THE System SHALL:
- Use environment variables for configuration
- Support different configurations per environment
- Document all configuration options

---

## 7.8 Compatibility Requirements

### NFR-COM-01: Browser Support
THE System SHALL support:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### NFR-COM-02: Camera Support
THE Edge Agent SHALL support:
- USB webcams
- Built-in laptop cameras
- IP cameras (via RTSP)

### NFR-COM-03: Database Compatibility
THE System SHALL support:
- PostgreSQL 13+
- SQLite (for development)

---

## 7.9 Requirements Summary Table

| Category | ID | Requirement | Priority |
|----------|-----|-------------|----------|
| Performance | NFR-PERF-01 | Response time limits | High |
| Performance | NFR-PERF-02 | Concurrent user support | High |
| Performance | NFR-PERF-03 | Real-time updates | High |
| Performance | NFR-PERF-04 | Database optimization | Medium |
| Performance | NFR-PERF-05 | Face recognition speed | High |
| Security | NFR-SEC-01 | JWT authentication | High |
| Security | NFR-SEC-02 | Password security | High |
| Security | NFR-SEC-03 | Data protection | High |
| Security | NFR-SEC-04 | Input validation | High |
| Security | NFR-SEC-05 | API security | High |
| Security | NFR-SEC-06 | Biometric protection | High |
| Usability | NFR-USE-01 | Accessibility | Medium |
| Usability | NFR-USE-02 | Responsiveness | High |
| Usability | NFR-USE-03 | User feedback | High |
| Usability | NFR-USE-04 | Learnability | Medium |
| Usability | NFR-USE-05 | Theme support | Low |
| Reliability | NFR-REL-01 | Availability | High |
| Reliability | NFR-REL-02 | Error handling | High |
| Reliability | NFR-REL-03 | Data integrity | High |
| Reliability | NFR-REL-04 | Recovery | Medium |
| Scalability | NFR-SCA-01 | Horizontal scaling | Medium |
| Scalability | NFR-SCA-02 | Database scaling | Medium |
| Scalability | NFR-SCA-03 | Concurrent sessions | High |
| Maintainability | NFR-MNT-01 | Code quality | High |
| Maintainability | NFR-MNT-02 | Modularity | High |
| Maintainability | NFR-MNT-03 | Testing | High |
| Maintainability | NFR-MNT-04 | Logging | Medium |
| Maintainability | NFR-MNT-05 | Configuration | Medium |
| Compatibility | NFR-COM-01 | Browser support | High |
| Compatibility | NFR-COM-02 | Camera support | High |
| Compatibility | NFR-COM-03 | Database compatibility | Medium |
