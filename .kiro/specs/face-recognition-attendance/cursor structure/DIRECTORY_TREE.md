# Complete Directory Tree Structure

This document shows the complete file and directory structure for the Face Recognition Attendance System.

```
FaceRecognitionAttendanceSystem-fastAPI_React/
│
├── .kiro/                                    # Project specifications
│   └── specs/
│       └── face-recognition-attendance/
│           ├── design.md
│           ├── requirements.md
│           └── tasks.md
│
├── shared/                                   # Shared utilities (used by all services)
│   ├── __init__.py
│   │
│   ├── database/                            # Singleton Pattern
│   │   ├── __init__.py
│   │   ├── connection.py                    # DatabaseConnection (Singleton)
│   │   ├── base.py                          # SQLAlchemy Base
│   │   └── session.py                       # Session management
│   │
│   ├── cache/                               # Singleton Pattern
│   │   ├── __init__.py
│   │   ├── cache_manager.py                 # CacheManager (Singleton)
│   │   └── decorators.py                    # Cache decorators
│   │
│   ├── config/                               # Singleton Pattern
│   │   ├── __init__.py
│   │   ├── settings.py                      # Pydantic Settings
│   │   └── loaders.py
│   │
│   ├── models/                               # Shared Pydantic models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── class.py
│   │   ├── attendance.py
│   │   └── notification.py
│   │
│   ├── exceptions/                           # Custom exceptions
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── auth.py
│   │   ├── validation.py
│   │   └── business.py
│   │
│   └── utils/                                # Common utilities
│       ├── __init__.py
│       ├── logger.py
│       └── helpers.py
│
├── api_gateway/                              # API Gateway Service
│   ├── __init__.py
│   ├── main.py                              # FastAPI app entry point
│   │
│   ├── middleware/                           # Chain of Responsibility
│   │   ├── __init__.py
│   │   ├── auth_middleware.py               # JWT/API Key validation
│   │   ├── rate_limit_middleware.py         # Rate limiting
│   │   ├── logging_middleware.py            # Request logging
│   │   ├── cors_middleware.py               # CORS handling
│   │   └── circuit_breaker.py               # Circuit Breaker Pattern
│   │
│   ├── routing/                              # Route configuration
│   │   ├── __init__.py
│   │   ├── router.py                        # Main router
│   │   └── service_routes.py                # Service mappings
│   │
│   ├── strategies/                           # Strategy Pattern
│   │   ├── __init__.py
│   │   ├── auth_strategy.py                 # IAuthStrategy interface
│   │   ├── jwt_strategy.py                  # JWT strategy
│   │   └── api_key_strategy.py              # API key strategy
│   │
│   ├── rate_limiter/                         # Rate limiting
│   │   ├── __init__.py
│   │   ├── token_bucket.py                  # Token bucket algorithm
│   │   └── redis_storage.py                 # Redis storage
│   │
│   └── config.py                             # Gateway config
│
├── services/                                 # Microservices
│   │
│   ├── auth_service/                         # Authentication Service
│   │   ├── __init__.py
│   │   ├── main.py                          # FastAPI app
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py                    # API routes
│   │   │   └── dependencies.py               # FastAPI dependencies
│   │   │
│   │   ├── services/                         # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py              # Main auth service
│   │   │   ├── token_service.py             # JWT handling
│   │   │   └── password_service.py           # Password hashing
│   │   │
│   │   ├── repositories/                     # Repository Pattern
│   │   │   ├── __init__.py
│   │   │   ├── base_repository.py           # IRepository interface
│   │   │   ├── user_repository.py           # User data access
│   │   │   └── api_key_repository.py         # API key data access
│   │   │
│   │   ├── strategies/                       # Strategy Pattern
│   │   │   ├── __init__.py
│   │   │   ├── auth_strategy.py             # IAuthStrategy
│   │   │   ├── jwt_strategy.py              # JWT strategy
│   │   │   └── api_key_strategy.py          # API key strategy
│   │   │
│   │   ├── models/                           # SQLAlchemy models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   └── api_key.py
│   │   │
│   │   └── schemas/                          # Pydantic schemas
│   │       ├── __init__.py
│   │       ├── request.py
│   │       └── response.py
│   │
│   ├── schedule_service/                     # Schedule Service
│   │   ├── __init__.py
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── schedule_service.py          # Main schedule service
│   │   │   └── enrollment_service.py        # Enrollment management
│   │   │
│   │   ├── repositories/                     # Repository Pattern
│   │   │   ├── __init__.py
│   │   │   ├── class_repository.py
│   │   │   ├── course_repository.py
│   │   │   └── enrollment_repository.py
│   │   │
│   │   ├── commands/                         # Command Pattern
│   │   │   ├── __init__.py
│   │   │   ├── base_command.py              # ICommand interface
│   │   │   ├── create_class_command.py
│   │   │   ├── update_class_command.py
│   │   │   └── delete_class_command.py
│   │   │
│   │   ├── strategies/                       # Strategy Pattern
│   │   │   ├── __init__.py
│   │   │   ├── filter_strategy.py           # IScheduleFilterStrategy
│   │   │   ├── student_filter.py            # Student filter
│   │   │   ├── mentor_filter.py             # Mentor filter
│   │   │   └── supervisor_filter.py         # Supervisor filter
│   │   │
│   │   ├── cache/                            # Cache-Aside Pattern
│   │   │   ├── __init__.py
│   │   │   └── schedule_cache.py
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── course.py
│   │   │   ├── class.py
│   │   │   └── enrollment.py
│   │   │
│   │   └── schemas/
│   │       ├── __init__.py
│   │       ├── request.py
│   │       └── response.py
│   │
│   ├── attendance_service/                   # Attendance Service
│   │   ├── __init__.py
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── attendance_service.py         # Main attendance service
│   │   │   └── session_service.py            # Session management
│   │   │
│   │   ├── repositories/
│   │   │   ├── __init__.py
│   │   │   ├── attendance_repository.py
│   │   │   └── session_repository.py
│   │   │
│   │   ├── state_machine/                    # State Pattern
│   │   │   ├── __init__.py
│   │   │   ├── class_state.py               # ClassState abstract
│   │   │   ├── inactive_state.py            # InactiveState
│   │   │   ├── active_state.py              # ActiveState
│   │   │   └── completed_state.py           # CompletedState
│   │   │
│   │   ├── facade/                           # Facade Pattern
│   │   │   ├── __init__.py
│   │   │   └── attendance_facade.py         # Attendance facade
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── attendance_record.py
│   │   │   └── attendance_session.py
│   │   │
│   │   └── schemas/
│   │       ├── __init__.py
│   │       ├── request.py
│   │       └── response.py
│   │
│   ├── ai_service/                           # AI Recognition Service
│   │   ├── __init__.py
│   │   ├── main.py
│   │   │
│   │   ├── consumer/                         # Producer-Consumer
│   │   │   ├── __init__.py
│   │   │   ├── message_consumer.py          # RabbitMQ consumer
│   │   │   └── frame_processor.py           # Frame processing
│   │   │
│   │   ├── adapters/                         # Adapter Pattern
│   │   │   ├── __init__.py
│   │   │   ├── base_adapter.py              # IFaceRecognitionAdapter
│   │   │   ├── face_recognition_adapter.py  # face_recognition lib
│   │   │   └── deepface_adapter.py          # DeepFace lib
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── recognition_service.py        # Main recognition service
│   │   │   └── encoding_service.py          # Encoding management
│   │   │
│   │   ├── repositories/
│   │   │   ├── __init__.py
│   │   │   └── face_encoding_repository.py
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── face_encoding.py
│   │   │
│   │   └── schemas/
│   │       ├── __init__.py
│   │       ├── request.py
│   │       └── response.py
│   │
│   └── notification_service/                 # Notification Service
│       ├── __init__.py
│       ├── main.py
│       │
│       ├── api/
│       │   ├── __init__.py
│       │   ├── routes.py
│       │   └── websocket.py                  # WebSocket endpoint
│       │
│       ├── services/
│       │   ├── __init__.py
│       │   └── notification_service.py      # Main notification service
│       │
│       ├── repositories/
│       │   ├── __init__.py
│       │   └── notification_repository.py
│       │
│       ├── factory/                           # Factory Pattern
│       │   ├── __init__.py
│       │   └── notification_factory.py      # Notification factory
│       │
│       ├── observer/                          # Observer Pattern
│       │   ├── __init__.py
│       │   ├── subject.py                   # NotificationSubject
│       │   ├── observer.py                  # NotificationObserver
│       │   └── websocket_observer.py        # WebSocket observer
│       │
│       ├── models/
│       │   ├── __init__.py
│       │   └── notification.py
│       │
│       └── schemas/
│           ├── __init__.py
│           ├── request.py
│           └── response.py
│
├── edge_agent/                               # Edge Agent Application
│   ├── __init__.py
│   ├── main.py                               # Main entry point
│   │
│   ├── camera/                               # Adapter Pattern
│   │   ├── __init__.py
│   │   ├── camera_adapter.py                 # ICameraAdapter
│   │   ├── opencv_adapter.py                 # OpenCV adapter
│   │   └── usb_camera_adapter.py             # USB camera adapter
│   │
│   ├── preprocessing/                         # Frame preprocessing
│   │   ├── __init__.py
│   │   ├── face_detector.py                  # Face detection
│   │   ├── frame_processor.py                # Frame processing
│   │   └── encoder.py                        # JPEG encoding
│   │
│   ├── api_client/                            # API communication
│   │   ├── __init__.py
│   │   ├── client.py                         # HTTP client
│   │   └── retry_handler.py                  # Retry logic
│   │
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py
│   │
│   └── utils/
│       ├── __init__.py
│       └── logger.py
│
├── frontend/                                  # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                       # Common components
│   │   │   ├── layout/                       # Layout components
│   │   │   └── notifications/                 # Notification components
│   │   │
│   │   ├── pages/
│   │   │   ├── auth/                         # Login page
│   │   │   ├── dashboard/                    # Dashboards
│   │   │   ├── schedule/                     # Schedule pages
│   │   │   ├── attendance/                   # Attendance pages
│   │   │   └── notifications/                # Notifications page
│   │   │
│   │   ├── services/                         # API services
│   │   │   ├── api.js
│   │   │   ├── auth.js
│   │   │   ├── schedule.js
│   │   │   ├── attendance.js
│   │   │   └── websocket.js
│   │   │
│   │   ├── hooks/                             # Custom hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useWebSocket.js
│   │   │   └── useNotifications.js
│   │   │
│   │   ├── context/                           # React Context
│   │   │   ├── AuthContext.js
│   │   │   └── NotificationContext.js
│   │   │
│   │   ├── utils/
│   │   │   ├── formatters.js
│   │   │   └── validators.js
│   │   │
│   │   └── App.jsx
│   │
│   ├── public/
│   └── package.json
│
├── docker-compose.yml                         # Docker orchestration
├── .env.example                               # Environment variables template
├── .gitignore
├── README.md
├── PROJECT_STRUCTURE.md                       # This structure explanation
└── DIRECTORY_TREE.md                          # This file
```

## Key Design Pattern Locations

### Singleton Pattern

- `shared/database/connection.py` - Database connection
- `shared/cache/cache_manager.py` - Redis cache manager
- `shared/config/settings.py` - Configuration settings

### Repository Pattern

- All `repositories/` directories in each service
- `shared/database/base.py` - Base repository interface

### Strategy Pattern

- `api_gateway/strategies/` - Authentication strategies
- `services/auth_service/strategies/` - Auth strategies
- `services/schedule_service/strategies/` - Filter strategies

### Factory Pattern

- `services/notification_service/factory/` - Notification factory

### Observer Pattern

- `services/notification_service/observer/` - WebSocket observers

### State Pattern

- `services/attendance_service/state_machine/` - Class state machine

### Command Pattern

- `services/schedule_service/commands/` - CRUD commands

### Adapter Pattern

- `services/ai_service/adapters/` - Face recognition adapters
- `edge_agent/camera/` - Camera adapters

### Facade Pattern

- `api_gateway/` - API Gateway facade
- `services/attendance_service/facade/` - Attendance facade

### Chain of Responsibility

- `api_gateway/middleware/` - Middleware chain

### Producer-Consumer

- `services/ai_service/consumer/` - Message consumer
- Message Broker (RabbitMQ/Kafka) - External service

### Circuit Breaker

- `api_gateway/middleware/circuit_breaker.py`

### Cache-Aside

- `services/schedule_service/cache/` - Schedule caching
