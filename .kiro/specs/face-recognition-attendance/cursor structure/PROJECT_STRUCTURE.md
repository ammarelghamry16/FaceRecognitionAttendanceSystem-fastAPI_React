# Face Recognition Attendance System - Project Structure

## Overview

This document outlines the complete project structure for the Face Recognition Attendance System, following a microservices architecture with design patterns for maintainability, scalability, and flexibility.

## Architecture Pattern: Microservices

The system is divided into independent services that communicate through APIs and message queues, allowing for:

- Independent deployment and scaling
- Technology diversity per service
- Fault isolation
- Team autonomy

---

## Root Directory Structure

```
FaceRecognitionAttendanceSystem-fastAPI_React/
│
├── .kiro/                          # Project specifications and documentation
│   └── specs/
│       └── face-recognition-attendance/
│           ├── design.md
│           ├── requirements.md
│           └── tasks.md
│
├── shared/                         # Shared utilities and common code
│   ├── __init__.py
│   ├── database/                   # Database connection (Singleton Pattern)
│   ├── cache/                      # Redis cache manager (Singleton Pattern)
│   ├── models/                     # Shared Pydantic models
│   ├── exceptions/                 # Custom exception classes
│   ├── utils/                      # Common utilities
│   └── config/                     # Configuration management (Singleton Pattern)
│
├── api_gateway/                    # API Gateway Service (Facade + Proxy Pattern)
│
├── services/                       # Microservices
│   ├── auth_service/               # Authentication Service (Strategy Pattern)
│   ├── schedule_service/           # Schedule Service (Command Pattern)
│   ├── attendance_service/         # Attendance Service (State Pattern)
│   ├── ai_service/                 # AI Recognition Service (Adapter Pattern)
│   └── notification_service/       # Notification Service (Observer + Factory Pattern)
│
├── edge_agent/                     # Edge Agent Application (Adapter Pattern)
│
├── frontend/                       # React Frontend Application
│
├── docker-compose.yml              # Docker orchestration
├── .env.example                    # Environment variables template
└── README.md                       # Project documentation
```

---

## 1. Shared Module (`shared/`)

**Purpose**: Common code shared across all services to avoid duplication.

### 1.1 Database Connection (`shared/database/`)

**Design Pattern: Singleton**

**Why Singleton?**

- Ensures only one database connection pool exists per service instance
- Prevents resource exhaustion from multiple connections
- Centralizes connection management

```
shared/database/
├── __init__.py
├── connection.py          # Singleton database connection manager
├── base.py                # SQLAlchemy Base class
└── session.py             # Database session management
```

**Key Components:**

- `DatabaseConnection` (Singleton): Manages PostgreSQL connection pool
- `get_db_session()`: Context manager for database sessions
- Connection pooling configuration

### 1.2 Cache Manager (`shared/cache/`)

**Design Pattern: Singleton**

**Why Singleton?**

- Single Redis connection instance per service
- Consistent caching behavior across the service
- Efficient resource usage

```
shared/cache/
├── __init__.py
├── cache_manager.py       # Singleton Redis cache manager
└── decorators.py          # Cache decorators (Cache-Aside Pattern)
```

**Key Components:**

- `CacheManager` (Singleton): Redis client wrapper
- Cache-aside pattern implementation
- TTL management

### 1.3 Configuration (`shared/config/`)

**Design Pattern: Singleton**

**Why Singleton?**

- Single source of truth for configuration
- Loaded once at startup
- Environment variable management

```
shared/config/
├── __init__.py
├── settings.py            # Pydantic Settings (Singleton)
└── loaders.py             # Configuration loaders
```

### 1.4 Models (`shared/models/`)

**Purpose**: Shared Pydantic models for request/response validation

```
shared/models/
├── __init__.py
├── user.py                # User models
├── class.py               # Class models
├── attendance.py          # Attendance models
└── notification.py        # Notification models
```

### 1.5 Exceptions (`shared/exceptions/`)

**Purpose**: Custom exception classes for consistent error handling

```
shared/exceptions/
├── __init__.py
├── base.py                # Base exception classes
├── auth.py                # Authentication exceptions
├── validation.py           # Validation exceptions
└── business.py            # Business logic exceptions
```

---

## 2. API Gateway (`api_gateway/`)

**Design Patterns: Facade, Proxy, Chain of Responsibility**

**Why Facade?**

- Provides a unified interface to multiple microservices
- Simplifies client interactions
- Hides service complexity

**Why Proxy?**

- Acts as intermediary for all requests
- Implements cross-cutting concerns (auth, rate limiting, logging)
- Can cache responses

**Why Chain of Responsibility?**

- Middleware chain processes requests sequentially
- Each middleware handles a specific concern
- Easy to add/remove middleware

```
api_gateway/
├── __init__.py
├── main.py                # FastAPI application entry point
│
├── middleware/            # Chain of Responsibility Pattern
│   ├── __init__.py
│   ├── auth_middleware.py      # JWT/API Key validation (Strategy Pattern)
│   ├── rate_limit_middleware.py # Rate limiting (Token Bucket)
│   ├── logging_middleware.py    # Request/response logging
│   ├── cors_middleware.py       # CORS handling
│   └── circuit_breaker.py       # Circuit Breaker Pattern
│
├── routing/               # Route configuration
│   ├── __init__.py
│   ├── router.py          # Main router configuration
│   └── service_routes.py  # Service endpoint mappings
│
├── strategies/            # Strategy Pattern for Authentication
│   ├── __init__.py
│   ├── auth_strategy.py   # IAuthStrategy interface
│   ├── jwt_strategy.py    # JWT validation strategy
│   └── api_key_strategy.py # API key validation strategy
│
├── rate_limiter/          # Rate Limiting Implementation
│   ├── __init__.py
│   ├── token_bucket.py    # Token bucket algorithm
│   └── redis_storage.py   # Redis-backed rate limit storage
│
└── config.py              # Gateway configuration
```

**Key Components:**

- `APIGateway`: Main FastAPI application
- `AuthMiddleware`: Validates JWT/API keys using Strategy pattern
- `RateLimitMiddleware`: Implements token bucket algorithm
- `CircuitBreaker`: Prevents cascading failures

---

## 3. Authentication Service (`services/auth_service/`)

**Design Patterns: Strategy, Repository**

**Why Strategy?**

- Supports multiple authentication methods (JWT, API Key)
- Easy to add new authentication strategies
- Decouples authentication logic from service

**Why Repository?**

- Abstracts database access
- Makes testing easier (can mock repository)
- Centralizes data access logic

```
services/auth_service/
├── __init__.py
├── main.py                # FastAPI application
│
├── api/                   # API endpoints
│   ├── __init__.py
│   ├── routes.py          # Route definitions
│   └── dependencies.py    # FastAPI dependencies
│
├── services/              # Business logic
│   ├── __init__.py
│   ├── auth_service.py    # Main authentication service
│   ├── token_service.py    # JWT token generation/validation
│   └── password_service.py # Password hashing (bcrypt)
│
├── repositories/          # Repository Pattern
│   ├── __init__.py
│   ├── base_repository.py # IRepository interface
│   ├── user_repository.py # User data access
│   └── api_key_repository.py # API key data access
│
├── strategies/            # Strategy Pattern
│   ├── __init__.py
│   ├── auth_strategy.py   # IAuthStrategy interface
│   ├── jwt_strategy.py    # JWT authentication strategy
│   └── api_key_strategy.py # API key authentication strategy
│
├── models/                # SQLAlchemy models
│   ├── __init__.py
│   ├── user.py
│   └── api_key.py
│
└── schemas/               # Pydantic schemas
    ├── __init__.py
    ├── request.py         # Request models
    └── response.py        # Response models
```

**Key Components:**

- `AuthService`: Orchestrates authentication using Strategy pattern
- `UserRepository`: Data access for users
- `JWTAuthStrategy`: JWT token handling
- `APIKeyAuthStrategy`: API key validation

---

## 4. Schedule Service (`services/schedule_service/`)

**Design Patterns: Command, Repository, Strategy, Cache-Aside**

**Why Command?**

- Encapsulates CRUD operations as commands
- Supports undo/redo functionality
- Queues operations for async processing

**Why Strategy?**

- Different filtering strategies for different roles
- Easy to add new filtering logic
- Decouples filtering from service logic

**Why Cache-Aside?**

- Improves read performance
- Reduces database load
- Automatic cache invalidation on updates

```
services/schedule_service/
├── __init__.py
├── main.py                # FastAPI application
│
├── api/
│   ├── __init__.py
│   └── routes.py
│
├── services/
│   ├── __init__.py
│   ├── schedule_service.py # Main schedule service
│   └── enrollment_service.py # Enrollment management
│
├── repositories/          # Repository Pattern
│   ├── __init__.py
│   ├── class_repository.py
│   ├── course_repository.py
│   └── enrollment_repository.py
│
├── commands/              # Command Pattern
│   ├── __init__.py
│   ├── base_command.py   # ICommand interface
│   ├── create_class_command.py
│   ├── update_class_command.py
│   └── delete_class_command.py
│
├── strategies/            # Strategy Pattern - Filtering
│   ├── __init__.py
│   ├── filter_strategy.py # IScheduleFilterStrategy interface
│   ├── student_filter.py  # Student schedule filter
│   ├── mentor_filter.py   # Mentor schedule filter
│   └── supervisor_filter.py # Supervisor schedule filter
│
├── cache/                 # Cache-Aside Pattern
│   ├── __init__.py
│   └── schedule_cache.py # Schedule caching logic
│
├── models/
│   ├── __init__.py
│   ├── course.py
│   ├── class.py
│   └── enrollment.py
│
└── schemas/
    ├── __init__.py
    ├── request.py
    └── response.py
```

**Key Components:**

- `ScheduleService`: Orchestrates schedule operations
- `CreateClassCommand`: Encapsulates class creation
- `StudentScheduleFilter`: Filters classes for students
- `ScheduleCache`: Manages Redis caching

---

## 5. Attendance Service (`services/attendance_service/`)

**Design Patterns: State, Repository, Facade**

**Why State?**

- Class/Session has distinct states (inactive, active, completed)
- State transitions are controlled and validated
- Prevents invalid state changes

**Why Facade?**

- Simplifies complex attendance workflow
- Hides complexity of state machine, repositories, notifications
- Single entry point for attendance operations

```
services/attendance_service/
├── __init__.py
├── main.py                # FastAPI application
│
├── api/
│   ├── __init__.py
│   └── routes.py
│
├── services/
│   ├── __init__.py
│   ├── attendance_service.py # Main attendance service
│   └── session_service.py    # Session management
│
├── repositories/
│   ├── __init__.py
│   ├── attendance_repository.py
│   └── session_repository.py
│
├── state_machine/          # State Pattern
│   ├── __init__.py
│   ├── class_state.py     # ClassState abstract class
│   ├── inactive_state.py  # InactiveState
│   ├── active_state.py    # ActiveState
│   └── completed_state.py # CompletedState
│
├── facade/                 # Facade Pattern
│   ├── __init__.py
│   └── attendance_facade.py # Simplifies attendance workflow
│
├── models/
│   ├── __init__.py
│   ├── attendance_record.py
│   └── attendance_session.py
│
└── schemas/
    ├── __init__.py
    ├── request.py
    └── response.py
```

**Key Components:**

- `AttendanceFacade`: Simplifies attendance operations
- `ClassState`: Base class for state pattern
- `ActiveState`: Handles active class behavior
- `AttendanceRepository`: Data access for attendance records

---

## 6. AI Recognition Service (`services/ai_service/`)

**Design Patterns: Adapter, Repository, Producer-Consumer**

**Why Adapter?**

- Adapts different face recognition libraries (face_recognition, DeepFace)
- Allows switching libraries without changing service code
- Provides consistent interface regardless of underlying library

**Why Producer-Consumer?**

- Edge Agent produces frames (producer)
- AI Service consumes frames (consumer)
- Decouples frame capture from processing
- Handles load spikes

```
services/ai_service/
├── __init__.py
├── main.py                # FastAPI application
│
├── consumer/              # Producer-Consumer Pattern
│   ├── __init__.py
│   ├── message_consumer.py # RabbitMQ consumer
│   └── frame_processor.py  # Frame processing logic
│
├── adapters/              # Adapter Pattern
│   ├── __init__.py
│   ├── face_recognition_adapter.py # face_recognition library adapter
│   ├── deepface_adapter.py         # DeepFace library adapter
│   └── base_adapter.py              # IFaceRecognitionAdapter interface
│
├── services/
│   ├── __init__.py
│   ├── recognition_service.py # Main recognition service
│   └── encoding_service.py    # Face encoding management
│
├── repositories/
│   ├── __init__.py
│   └── face_encoding_repository.py
│
├── models/
│   ├── __init__.py
│   └── face_encoding.py
│
└── schemas/
    ├── __init__.py
    ├── request.py
    └── response.py
```

**Key Components:**

- `MessageConsumer`: Consumes frames from RabbitMQ
- `FaceRecognitionAdapter`: Adapter for face_recognition library
- `RecognitionService`: Orchestrates face recognition
- `FaceEncodingRepository`: Manages face encodings in database

---

## 7. Notification Service (`services/notification_service/`)

**Design Patterns: Observer, Factory, Repository**

**Why Observer?**

- WebSocket clients observe notification subject
- Automatic notification delivery to all observers
- Decouples notification creation from delivery

**Why Factory?**

- Creates different notification types (class_started, attendance_confirmed, etc.)
- Encapsulates notification creation logic
- Easy to add new notification types

```
services/notification_service/
├── __init__.py
├── main.py                # FastAPI application
│
├── api/
│   ├── __init__.py
│   ├── routes.py
│   └── websocket.py       # WebSocket endpoint
│
├── services/
│   ├── __init__.py
│   └── notification_service.py # Main notification service
│
├── repositories/
│   ├── __init__.py
│   └── notification_repository.py
│
├── factory/                # Factory Pattern
│   ├── __init__.py
│   └── notification_factory.py # Creates notification objects
│
├── observer/               # Observer Pattern
│   ├── __init__.py
│   ├── subject.py         # NotificationSubject
│   ├── observer.py        # NotificationObserver interface
│   └── websocket_observer.py # WebSocket client observer
│
├── models/
│   ├── __init__.py
│   └── notification.py
│
└── schemas/
    ├── __init__.py
    ├── request.py
    └── response.py
```

**Key Components:**

- `NotificationFactory`: Creates notification objects
- `NotificationSubject`: Manages observer list and notifies them
- `WebSocketObserver`: Delivers notifications via WebSocket
- `NotificationRepository`: Stores notifications in database

---

## 8. Edge Agent (`edge_agent/`)

**Design Patterns: Adapter, Retry Pattern**

**Why Adapter?**

- Adapts different camera hardware interfaces
- Provides consistent interface regardless of camera type
- Handles camera initialization and frame capture

```
edge_agent/
├── __init__.py
├── main.py                # Main application entry point
│
├── camera/                # Adapter Pattern
│   ├── __init__.py
│   ├── camera_adapter.py  # ICameraAdapter interface
│   ├── opencv_adapter.py  # OpenCV camera adapter
│   └── usb_camera_adapter.py # USB camera adapter
│
├── preprocessing/         # Frame preprocessing
│   ├── __init__.py
│   ├── face_detector.py   # Face detection (Haar Cascade/MTCNN)
│   ├── frame_processor.py # Frame normalization and resizing
│   └── encoder.py         # JPEG encoding
│
├── api_client/            # API communication
│   ├── __init__.py
│   ├── client.py          # HTTP client for API Gateway
│   └── retry_handler.py   # Retry logic with exponential backoff
│
├── config/
│   ├── __init__.py
│   └── settings.py        # Configuration management
│
└── utils/
    ├── __init__.py
    └── logger.py          # Logging utilities
```

**Key Components:**

- `CameraAdapter`: Interface for camera operations
- `OpenCVAdapter`: OpenCV-based camera implementation
- `RetryHandler`: Implements exponential backoff retry
- `FrameProcessor`: Preprocesses frames before sending

---

## 9. Frontend (`frontend/`)

**Purpose**: React-based user interface

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── common/        # Common components (buttons, inputs)
│   │   ├── layout/        # Layout components (sidebar, header)
│   │   └── notifications/ # Notification components
│   │
│   ├── pages/             # Page components
│   │   ├── auth/          # Login page
│   │   ├── dashboard/     # Role-based dashboards
│   │   ├── schedule/      # Schedule management
│   │   ├── attendance/    # Attendance views
│   │   └── notifications/ # Notifications page
│   │
│   ├── services/          # API service layer
│   │   ├── api.js         # Axios configuration
│   │   ├── auth.js        # Authentication API
│   │   ├── schedule.js    # Schedule API
│   │   ├── attendance.js  # Attendance API
│   │   └── websocket.js   # WebSocket service
│   │
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.js     # Authentication hook
│   │   ├── useWebSocket.js # WebSocket hook
│   │   └── useNotifications.js # Notifications hook
│   │
│   ├── context/           # React Context
│   │   ├── AuthContext.js # Authentication context
│   │   └── NotificationContext.js # Notification context
│   │
│   ├── utils/             # Utility functions
│   │   ├── formatters.js  # Date/time formatters
│   │   └── validators.js  # Form validators
│   │
│   └── App.jsx            # Main application component
│
├── public/
└── package.json
```

---

## Design Patterns Summary

### Creational Patterns

1. **Singleton**

   - Database connections
   - Cache manager
   - Configuration settings
   - **Why**: Ensure single instance, resource efficiency

2. **Factory**
   - Notification creation
   - Service client creation
   - **Why**: Encapsulate object creation, support multiple types

### Structural Patterns

3. **Repository**

   - All data access layers
   - **Why**: Abstract database access, improve testability

4. **Adapter**

   - Camera hardware
   - Face recognition libraries
   - **Why**: Integrate different libraries/hardware seamlessly

5. **Facade**

   - API Gateway
   - Attendance Facade
   - **Why**: Simplify complex subsystems

6. **Proxy**
   - API Gateway (caching, rate limiting)
   - **Why**: Add cross-cutting concerns transparently

### Behavioral Patterns

7. **Observer**

   - WebSocket notifications
   - **Why**: Real-time updates to multiple clients

8. **State**

   - Class/Session state machine
   - **Why**: Control state transitions, prevent invalid states

9. **Strategy**

   - Authentication methods
   - Schedule filtering
   - **Why**: Interchangeable algorithms, reduce conditionals

10. **Chain of Responsibility**

    - API Gateway middleware
    - **Why**: Process requests through multiple handlers

11. **Command**

    - CRUD operations in Schedule Service
    - **Why**: Encapsulate operations, support undo/redo

12. **Template Method**
    - Base service structure
    - **Why**: Define algorithm skeleton, allow customization

### Concurrency Patterns

13. **Producer-Consumer**

    - Message Broker (RabbitMQ)
    - **Why**: Decouple frame capture from processing

14. **Circuit Breaker**
    - API Gateway fault tolerance
    - **Why**: Prevent cascading failures

### Data Patterns

15. **Cache-Aside**
    - Schedule caching
    - **Why**: Improve read performance, reduce DB load

---

## Service Communication Flow

```
Client Request
    ↓
API Gateway (Facade + Proxy)
    ├── Auth Middleware (Strategy)
    ├── Rate Limit Middleware
    ├── Circuit Breaker
    └── Route to Service
        ↓
Microservice (Repository Pattern)
    ├── Service Layer
    ├── Repository Layer
    └── Database (Singleton)
```

**For Face Recognition:**

```
Edge Agent (Adapter)
    ↓
API Gateway
    ↓
Message Broker (Producer-Consumer)
    ↓
AI Service (Adapter Pattern)
    ↓
Attendance Service (State Pattern)
    ↓
Notification Service (Observer + Factory)
    ↓
WebSocket Clients (Observer)
```

---

## Benefits of This Structure

1. **Maintainability**: Clear separation of concerns, easy to locate code
2. **Scalability**: Services can scale independently
3. **Testability**: Patterns enable easy mocking and testing
4. **Flexibility**: Easy to swap implementations (Strategy, Adapter)
5. **Reliability**: Circuit breaker, retry patterns handle failures
6. **Performance**: Caching, async processing improve response times

---

## Next Steps

1. Create directory structure
2. Implement shared module first
3. Build services incrementally
4. Add design patterns as needed
5. Write tests for each component
