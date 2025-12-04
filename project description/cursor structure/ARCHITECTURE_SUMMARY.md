# Architecture Summary - Face Recognition Attendance System

This document provides a high-level overview of the system architecture, design patterns, and how everything fits together.

---

## System Overview

The Face Recognition Attendance System is a **microservices-based, event-driven application** that automates student attendance tracking using AI-powered face recognition.

### Key Characteristics

- **Microservices Architecture**: Independent, deployable services
- **Event-Driven**: Asynchronous processing via message broker
- **Design Pattern Rich**: 15+ design patterns for maintainability
- **Scalable**: Services can scale independently
- **Fault Tolerant**: Circuit breakers, retries, error handling

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  ┌──────────────┐              ┌──────────────┐         │
│  │  React UI    │              │ Edge Agent   │         │
│  │  (Browser)   │              │  (Camera)    │         │
│  └──────┬───────┘              └──────┬───────┘         │
└─────────┼──────────────────────────────┼─────────────────┘
          │                              │
          │ HTTPS + JWT                  │ HTTPS + API Key
          │                              │
┌─────────▼──────────────────────────────▼─────────────────┐
│                  API Gateway Layer                        │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Facade + Proxy + Chain of Responsibility       │    │
│  │  • Authentication (Strategy)                    │    │
│  │  • Rate Limiting                                │    │
│  │  • Circuit Breaker                              │    │
│  │  • Request Routing                              │    │
│  └──────────────────────────────────────────────────┘    │
└─────────┬────────────────────────────────────────────────┘
          │
          ├──────────────────┬──────────────────┬──────────────┐
          │                  │                  │              │
┌─────────▼─────────┐ ┌──────▼──────┐ ┌─────────▼──────┐ ┌─────▼──────┐
│  Auth Service     │ │  Schedule   │ │  Attendance   │ │ Notification│
│  (Strategy)       │ │  Service    │ │  Service      │ │  Service   │
│                   │ │  (Command)  │ │  (State)      │ │ (Observer) │
└─────────┬─────────┘ └──────┬──────┘ └─────────┬──────┘ └─────┬──────┘
          │                  │                  │              │
          └──────────────────┴──────────────────┴──────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Message Broker   │
                    │ (Producer-Consumer)│
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   AI Service       │
                    │   (Adapter)       │
                    └────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          │                                       │
┌─────────▼─────────┐                  ┌─────────▼─────────┐
│   PostgreSQL      │                  │   Redis Cache      │
│   (Singleton)     │                  │   (Singleton)     │
└───────────────────┘                  └────────────────────┘
```

---

## Service Breakdown

### 1. API Gateway
**Patterns**: Facade, Proxy, Chain of Responsibility, Strategy

**Responsibilities**:
- Single entry point for all requests
- Authentication (JWT/API Key) using Strategy pattern
- Rate limiting (Token Bucket algorithm)
- Request routing to services
- Circuit breaker for fault tolerance

**Key Files**:
- `api_gateway/middleware/` - Middleware chain
- `api_gateway/strategies/` - Authentication strategies

---

### 2. Authentication Service
**Patterns**: Strategy, Repository

**Responsibilities**:
- User authentication and authorization
- JWT token generation and validation
- API key management for Edge Agents
- Password hashing and validation

**Key Files**:
- `services/auth_service/strategies/` - Auth strategies
- `services/auth_service/repositories/` - Data access

---

### 3. Schedule Service
**Patterns**: Command, Repository, Strategy, Cache-Aside

**Responsibilities**:
- Class schedule management (CRUD)
- Role-based schedule filtering (Strategy)
- Student enrollment management
- Cache management for performance

**Key Files**:
- `services/schedule_service/commands/` - CRUD commands
- `services/schedule_service/strategies/` - Filter strategies
- `services/schedule_service/cache/` - Caching logic

---

### 4. Attendance Service
**Patterns**: State, Repository, Facade

**Responsibilities**:
- Attendance session management
- Class state machine (inactive → active → completed)
- Manual attendance marking
- Attendance history and statistics

**Key Files**:
- `services/attendance_service/state_machine/` - State pattern
- `services/attendance_service/facade/` - Attendance facade

---

### 5. AI Recognition Service
**Patterns**: Adapter, Repository, Producer-Consumer

**Responsibilities**:
- Face recognition from camera frames
- Face encoding management
- Recognition result processing
- Integration with face recognition libraries

**Key Files**:
- `services/ai_service/adapters/` - Library adapters
- `services/ai_service/consumer/` - Message consumer

---

### 6. Notification Service
**Patterns**: Observer, Factory, Repository

**Responsibilities**:
- Real-time notification delivery via WebSocket
- Notification creation (Factory pattern)
- Notification storage and retrieval
- Observer pattern for WebSocket clients

**Key Files**:
- `services/notification_service/factory/` - Notification factory
- `services/notification_service/observer/` - Observer pattern

---

### 7. Edge Agent
**Patterns**: Adapter, Retry

**Responsibilities**:
- Camera frame capture
- Frame preprocessing (face detection, normalization)
- Frame upload to API Gateway
- Retry logic for network failures

**Key Files**:
- `edge_agent/camera/` - Camera adapters
- `edge_agent/api_client/` - API communication

---

## Design Patterns by Category

### Creational Patterns
1. **Singleton** - Database, Cache, Config
2. **Factory** - Notification creation

### Structural Patterns
3. **Repository** - Data access abstraction
4. **Adapter** - Camera, AI libraries
5. **Facade** - API Gateway, Attendance Facade
6. **Proxy** - API Gateway caching, rate limiting

### Behavioral Patterns
7. **Observer** - WebSocket notifications
8. **State** - Class/Session state machine
9. **Strategy** - Authentication, Filtering
10. **Chain of Responsibility** - Middleware chain
11. **Command** - CRUD operations
12. **Template Method** - Base service structure

### Concurrency Patterns
13. **Producer-Consumer** - Message Broker
14. **Circuit Breaker** - Fault tolerance

### Data Patterns
15. **Cache-Aside** - Schedule caching

---

## Data Flow Examples

### Example 1: Class Activation Flow

```
Mentor (UI)
    ↓ POST /api/class/{id}/activate
API Gateway
    ├── Auth Middleware (JWT Strategy)
    ├── Rate Limit Check
    └── Route to Attendance Service
        ↓
Attendance Service
    ├── State Machine (Inactive → Active)
    ├── Repository (Update class state)
    ├── Create attendance session
    └── Trigger notification
        ↓
Notification Service
    ├── Factory (Create class_started notification)
    ├── Repository (Store notification)
    └── Observer (Broadcast via WebSocket)
        ↓
Students (WebSocket clients receive notification)
```

### Example 2: Face Recognition Flow

```
Edge Agent
    ├── Camera Adapter (Capture frame)
    ├── Preprocessing (Face detection, normalization)
    └── POST /api/face/upload
        ↓
API Gateway
    ├── API Key Validation (Strategy)
    └── Publish to Message Broker
        ↓
Message Broker (RabbitMQ)
    └── Queue: face_recognition_queue
        ↓
AI Service Consumer
    ├── Consume message
    ├── Adapter (Face recognition library)
    ├── Match faces with student encodings
    └── POST to Attendance Service
        ↓
Attendance Service
    ├── Update attendance records
    └── Trigger notification
        ↓
Notification Service
    └── Observer (Send to student via WebSocket)
```

---

## Shared Module

The `shared/` module contains code used by all services:

- **Database Connection** (Singleton): PostgreSQL connection pool
- **Cache Manager** (Singleton): Redis cache client
- **Configuration** (Singleton): Environment-based settings
- **Models**: Shared Pydantic models
- **Exceptions**: Custom exception classes
- **Utils**: Common utility functions

**Why Shared?**
- Avoids code duplication
- Ensures consistency across services
- Single source of truth for common functionality

---

## Communication Patterns

### Synchronous Communication
- **HTTP/REST**: Service-to-service via API Gateway
- **Direct Service Calls**: Internal service communication

### Asynchronous Communication
- **Message Broker**: Face recognition requests (Edge Agent → AI Service)
- **WebSocket**: Real-time notifications (Notification Service → Clients)

---

## Technology Stack

### Backend
- **FastAPI**: All microservices
- **PostgreSQL**: Primary database
- **Redis**: Caching and rate limiting
- **RabbitMQ/Kafka**: Message broker
- **SQLAlchemy**: ORM
- **Pydantic**: Data validation

### Frontend
- **React**: UI framework
- **WebSocket**: Real-time notifications
- **Axios**: HTTP client

### AI/ML
- **face_recognition** or **DeepFace**: Face recognition
- **OpenCV**: Image processing

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Local development

---

## Key Design Decisions

### 1. Why Microservices?
- **Scalability**: Scale services independently
- **Technology Diversity**: Use best tool for each service
- **Fault Isolation**: Failure in one service doesn't crash entire system
- **Team Autonomy**: Teams can work independently

### 2. Why API Gateway?
- **Single Entry Point**: Simplifies client interactions
- **Cross-Cutting Concerns**: Centralized auth, rate limiting, logging
- **Service Discovery**: Routes requests to correct services
- **Protocol Translation**: Can translate between protocols if needed

### 3. Why Message Broker?
- **Decoupling**: Edge Agent doesn't wait for AI processing
- **Load Handling**: Queue buffers requests during spikes
- **Reliability**: Messages persist if service is down
- **Scalability**: Multiple AI service instances can consume

### 4. Why Design Patterns?
- **Maintainability**: Clear structure, easy to understand
- **Testability**: Patterns enable easy mocking
- **Flexibility**: Easy to swap implementations
- **Reusability**: Patterns are proven solutions

---

## File Organization Principles

1. **Separation of Concerns**: Each service is independent
2. **Layer Separation**: API → Service → Repository → Database
3. **Pattern Organization**: Patterns grouped in dedicated directories
4. **Shared Code**: Common code in `shared/` module
5. **Consistent Structure**: All services follow same structure

---

## Getting Started

1. **Read Documentation**:
   - `PROJECT_STRUCTURE.md` - Detailed structure explanation
   - `DESIGN_PATTERNS_GUIDE.md` - Pattern quick reference
   - `DIRECTORY_TREE.md` - Visual directory structure

2. **Set Up Environment**:
   - Install dependencies
   - Configure environment variables
   - Set up database and Redis

3. **Start with Shared Module**:
   - Database connection
   - Cache manager
   - Configuration

4. **Build Services Incrementally**:
   - Start with Auth Service
   - Add Schedule Service
   - Continue with other services

5. **Implement Patterns**:
   - Add patterns as you build each service
   - Refer to `DESIGN_PATTERNS_GUIDE.md` for implementation

---

## Documentation Files

- **PROJECT_STRUCTURE.md**: Complete structure explanation with patterns
- **DIRECTORY_TREE.md**: Visual directory tree
- **DESIGN_PATTERNS_GUIDE.md**: Design patterns quick reference
- **ARCHITECTURE_SUMMARY.md**: This file - high-level overview

---

## Next Steps

1. Review all documentation files
2. Set up project directory structure
3. Implement shared module
4. Build services one by one
5. Add design patterns incrementally
6. Write tests for each component
7. Set up Docker containers
8. Integration testing

---

## Questions?

Refer to:
- **Design Document** (`.kiro/specs/face-recognition-attendance/design.md`) for detailed design
- **Requirements Document** (`.kiro/specs/face-recognition-attendance/requirements.md`) for requirements
- **Tasks Document** (`.kiro/specs/face-recognition-attendance/tasks.md`) for implementation plan

