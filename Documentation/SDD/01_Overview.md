# Software Design Document (SDD)

## 1. Document Overview

### 1.1 Purpose
This Software Design Document (SDD) describes the architecture, design patterns, and implementation details of the Face Recognition Attendance System. It serves as a technical reference for developers and evaluators.

### 1.2 Scope
This document covers:
- System architecture and component design
- Design patterns implementation
- Data models and database schema
- API specifications
- Testing strategy

### 1.3 Document Organization

| Section | Description |
|---------|-------------|
| Architecture | System architecture and component diagrams |
| Design Patterns | Patterns used and their implementation |
| Data Design | Database schema and models |
| API Design | REST API specifications |
| Testing | Test coverage and strategies |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐                       │
│  │    Web Browser       │    │    Edge Agent        │                       │
│  │    (React SPA)       │    │    (Python)          │                       │
│  │                      │    │                      │                       │
│  │  - Dashboard         │    │  - Camera Capture    │                       │
│  │  - Schedule          │    │  - Face Detection    │                       │
│  │  - Attendance        │    │  - API Client        │                       │
│  │  - Face Enrollment   │    │                      │                       │
│  └──────────┬───────────┘    └──────────┬───────────┘                       │
│             │                           │                                    │
│             │  HTTP/WebSocket           │  HTTP                             │
│             │                           │                                    │
└─────────────┼───────────────────────────┼────────────────────────────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         FastAPI Application                           │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │    Auth     │  │  Schedule   │  │ Attendance  │  │     AI      │  │   │
│  │  │   Service   │  │   Service   │  │   Service   │  │   Service   │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐                                    │   │
│  │  │Notification │  │    Stats    │                                    │   │
│  │  │   Service   │  │   Service   │                                    │   │
│  │  └─────────────┘  └─────────────┘                                    │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐                       │
│  │     PostgreSQL       │    │       Redis          │                       │
│  │                      │    │                      │                       │
│  │  - Users             │    │  - Session Cache     │                       │
│  │  - Courses           │    │  - Rate Limiting     │                       │
│  │  - Classes           │    │  - Token Blacklist   │                       │
│  │  - Attendance        │    │                      │                       │
│  │  - Face Encodings    │    │                      │                       │
│  │  - Notifications     │    │                      │                       │
│  └──────────────────────┘    └──────────────────────┘                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND COMPONENTS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          SHARED MODULE                               │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │   Database   │  │    Cache     │  │   Config     │               │    │
│  │  │  Connection  │  │   Manager    │  │   Settings   │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │   Models     │  │  Exceptions  │  │   Utils      │               │    │
│  │  │   (Base)     │  │              │  │              │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │    AUTH SERVICE     │  │  SCHEDULE SERVICE   │  │ ATTENDANCE SERVICE  │  │
│  │                     │  │                     │  │                     │  │
│  │  ┌───────────────┐  │  │  ┌───────────────┐  │  │  ┌───────────────┐  │  │
│  │  │   Strategies  │  │  │  │  Repositories │  │  │  │ State Machine │  │  │
│  │  │  - JWT        │  │  │  │  - Course     │  │  │  │  - Inactive   │  │  │
│  │  │  - API Key    │  │  │  │  - Class      │  │  │  │  - Active     │  │  │
│  │  └───────────────┘  │  │  │  - Enrollment │  │  │  │  - Completed  │  │  │
│  │  ┌───────────────┐  │  │  └───────────────┘  │  │  └───────────────┘  │  │
│  │  │  Repositories │  │  │  ┌───────────────┐  │  │  ┌───────────────┐  │  │
│  │  │  - User       │  │  │  │   Services    │  │  │  │  Repositories │  │  │
│  │  │  - API Key    │  │  │  │  - Schedule   │  │  │  │  - Session    │  │  │
│  │  └───────────────┘  │  │  │  - Enrollment │  │  │  │  - Record     │  │  │
│  │  ┌───────────────┐  │  │  └───────────────┘  │  │  └───────────────┘  │  │
│  │  │   Services    │  │  │                     │  │  ┌───────────────┐  │  │
│  │  │  - Token      │  │  │                     │  │  │   Services    │  │  │
│  │  │  - Password   │  │  │                     │  │  │  - Attendance │  │  │
│  │  │  - Auth       │  │  │                     │  │  │  - Session    │  │  │
│  │  └───────────────┘  │  │                     │  │  └───────────────┘  │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
│                                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │     AI SERVICE      │  │NOTIFICATION SERVICE │  │   STATS SERVICE     │  │
│  │                     │  │                     │  │                     │  │
│  │  ┌───────────────┐  │  │  ┌───────────────┐  │  │  ┌───────────────┐  │  │
│  │  │    Adapter    │  │  │  │    Factory    │  │  │  │   Services    │  │  │
│  │  │  - InsightFace│  │  │  │  - Notif Types│  │  │  │  - Dashboard  │  │  │
│  │  └───────────────┘  │  │  └───────────────┘  │  │  │  - Reports    │  │  │
│  │  ┌───────────────┐  │  │  ┌───────────────┐  │  │  └───────────────┘  │  │
│  │  │   Services    │  │  │  │   Observer    │  │  │                     │  │
│  │  │  - Recognition│  │  │  │  - WebSocket  │  │  │                     │  │
│  │  │  - Quality    │  │  │  └───────────────┘  │  │                     │  │
│  │  │  - Pose       │  │  │  ┌───────────────┐  │  │                     │  │
│  │  │  - Liveness   │  │  │  │  Repository   │  │  │                     │  │
│  │  │  - Centroid   │  │  │  │  - Notif      │  │  │                     │  │
│  │  └───────────────┘  │  │  └───────────────┘  │  │                     │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 | UI Framework |
| Frontend | TypeScript | Type Safety |
| Frontend | TailwindCSS | Styling |
| Frontend | Vite | Build Tool |
| Frontend | Axios | HTTP Client |
| Backend | FastAPI | Web Framework |
| Backend | SQLAlchemy | ORM |
| Backend | Pydantic | Validation |
| Backend | JWT | Authentication |
| Database | PostgreSQL | Primary Database |
| Cache | Redis | Caching & Sessions |
| AI | InsightFace | Face Recognition |
| AI | OpenCV | Image Processing |
| Testing | Pytest | Backend Tests |
| Testing | Playwright | E2E Tests |
| Testing | Hypothesis | Property Tests |
