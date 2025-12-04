# Design Patterns Quick Reference Guide

This guide provides a quick reference for all design patterns used in the Face Recognition Attendance System, explaining what they are, where they're used, and why.

---

## Creational Patterns

### 1. Singleton Pattern

**What it is**: Ensures a class has only one instance and provides global access to it.

**Where it's used**:
- `shared/database/connection.py` - Database connection pool
- `shared/cache/cache_manager.py` - Redis cache manager
- `shared/config/settings.py` - Configuration settings

**Why we use it**:
- **Database**: Prevents multiple connection pools, saves resources
- **Cache**: Single Redis connection per service instance
- **Config**: Load configuration once, use everywhere

**Example Structure**:
```python
class DatabaseConnection:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
```

---

### 2. Factory Pattern

**What it is**: Creates objects without specifying the exact class of object that will be created.

**Where it's used**:
- `services/notification_service/factory/notification_factory.py`

**Why we use it**:
- Creates different notification types (class_started, attendance_confirmed, etc.)
- Encapsulates notification creation logic
- Easy to add new notification types without changing existing code

**Example Structure**:
```python
class NotificationFactory:
    @staticmethod
    def create_notification(type: str, data: dict) -> Notification:
        if type == "class_started":
            return ClassStartedNotification(data)
        elif type == "attendance_confirmed":
            return AttendanceConfirmedNotification(data)
        # ... more types
```

---

## Structural Patterns

### 3. Repository Pattern

**What it is**: Abstracts data access logic, providing a collection-like interface for accessing domain objects.

**Where it's used**:
- All `repositories/` directories in every service
- `shared/database/base.py` - Base repository interface

**Why we use it**:
- Separates business logic from data access
- Makes testing easier (can mock repositories)
- Centralizes database queries
- Can swap database implementations easily

**Example Structure**:
```python
class IRepository(ABC):
    @abstractmethod
    def find_by_id(self, id: UUID) -> T:
        pass
    
    @abstractmethod
    def create(self, entity: T) -> T:
        pass

class UserRepository(IRepository):
    def find_by_id(self, id: UUID) -> User:
        # Database query implementation
        pass
```

---

### 4. Adapter Pattern

**What it is**: Allows incompatible interfaces to work together by wrapping an object with an adapter.

**Where it's used**:
- `services/ai_service/adapters/` - Face recognition library adapters
- `edge_agent/camera/` - Camera hardware adapters

**Why we use it**:
- **AI Service**: Can switch between face_recognition and DeepFace libraries
- **Edge Agent**: Supports different camera types (USB, IP, etc.)
- Provides consistent interface regardless of underlying implementation

**Example Structure**:
```python
class IFaceRecognitionAdapter(ABC):
    @abstractmethod
    def detect_faces(self, image: bytes) -> List[Face]:
        pass

class FaceRecognitionAdapter(IFaceRecognitionAdapter):
    def detect_faces(self, image: bytes) -> List[Face]:
        # Uses face_recognition library
        pass

class DeepFaceAdapter(IFaceRecognitionAdapter):
    def detect_faces(self, image: bytes) -> List[Face]:
        # Uses DeepFace library
        pass
```

---

### 5. Facade Pattern

**What it is**: Provides a simplified interface to a complex subsystem.

**Where it's used**:
- `api_gateway/` - Simplifies access to all microservices
- `services/attendance_service/facade/attendance_facade.py`

**Why we use it**:
- **API Gateway**: Single entry point hides service complexity
- **Attendance Facade**: Simplifies complex attendance workflow (state machine, repositories, notifications)

**Example Structure**:
```python
class AttendanceFacade:
    def __init__(self, state_machine, repository, notification_service):
        self.state_machine = state_machine
        self.repository = repository
        self.notification_service = notification_service
    
    def activate_class(self, class_id: UUID):
        # Hides complexity of state transitions, notifications, etc.
        self.state_machine.activate()
        self.repository.update()
        self.notification_service.notify()
```

---

### 6. Proxy Pattern

**What it is**: Provides a surrogate or placeholder for another object to control access to it.

**Where it's used**:
- `api_gateway/` - Acts as proxy for all backend services

**Why we use it**:
- Adds cross-cutting concerns (auth, rate limiting, logging)
- Can cache responses
- Controls access to services
- Can implement circuit breaker

**Example Structure**:
```python
class APIGateway:
    def route_request(self, request):
        # Proxy behavior: add auth, rate limiting, logging
        self.authenticate(request)
        self.check_rate_limit(request)
        self.log_request(request)
        # Forward to actual service
        return self.forward_to_service(request)
```

---

## Behavioral Patterns

### 7. Observer Pattern

**What it is**: Defines a one-to-many dependency between objects so that when one object changes state, all dependents are notified.

**Where it's used**:
- `services/notification_service/observer/` - WebSocket notification system

**Why we use it**:
- Real-time notifications to multiple WebSocket clients
- Decouples notification creation from delivery
- Easy to add/remove observers

**Example Structure**:
```python
class NotificationSubject:
    def __init__(self):
        self._observers = []
    
    def attach(self, observer):
        self._observers.append(observer)
    
    def notify(self, notification):
        for observer in self._observers:
            observer.update(notification)

class WebSocketObserver:
    def update(self, notification):
        self.websocket.send(notification)
```

---

### 8. State Pattern

**What it is**: Allows an object to alter its behavior when its internal state changes.

**Where it's used**:
- `services/attendance_service/state_machine/` - Class state machine

**Why we use it**:
- Classes have distinct states (inactive, active, completed)
- State transitions are controlled and validated
- Prevents invalid state changes
- Each state can have different behavior

**Example Structure**:
```python
class ClassState(ABC):
    @abstractmethod
    def activate(self, class_obj):
        pass
    
    @abstractmethod
    def can_activate(self) -> bool:
        pass

class InactiveState(ClassState):
    def activate(self, class_obj):
        class_obj.state = ActiveState()
    
    def can_activate(self) -> bool:
        return True

class ActiveState(ClassState):
    def activate(self, class_obj):
        raise InvalidStateTransition("Already active")
    
    def can_activate(self) -> bool:
        return False
```

---

### 9. Strategy Pattern

**What it is**: Defines a family of algorithms, encapsulates each one, and makes them interchangeable.

**Where it's used**:
- `api_gateway/strategies/` - Authentication strategies
- `services/auth_service/strategies/` - Auth strategies
- `services/schedule_service/strategies/` - Schedule filtering strategies

**Why we use it**:
- **Authentication**: Support JWT and API key authentication
- **Filtering**: Different filtering logic for students, mentors, supervisors
- Reduces conditional statements (if/else chains)
- Easy to add new strategies

**Example Structure**:
```python
class IAuthStrategy(ABC):
    @abstractmethod
    def authenticate(self, credentials) -> AuthResult:
        pass

class JWTAuthStrategy(IAuthStrategy):
    def authenticate(self, credentials) -> AuthResult:
        # JWT validation logic
        pass

class APIKeyAuthStrategy(IAuthStrategy):
    def authenticate(self, credentials) -> AuthResult:
        # API key validation logic
        pass

class AuthService:
    def __init__(self, strategy: IAuthStrategy):
        self.strategy = strategy
    
    def login(self, credentials):
        return self.strategy.authenticate(credentials)
```

---

### 10. Chain of Responsibility Pattern

**What it is**: Passes requests along a chain of handlers until one handles it.

**Where it's used**:
- `api_gateway/middleware/` - Middleware chain

**Why we use it**:
- Each middleware handles a specific concern (auth, rate limit, logging)
- Requests flow through middleware sequentially
- Easy to add/remove middleware
- Separates concerns

**Example Structure**:
```python
class Middleware(ABC):
    def __init__(self, next_middleware=None):
        self.next = next_middleware
    
    @abstractmethod
    def handle(self, request):
        pass

class AuthMiddleware(Middleware):
    def handle(self, request):
        # Authenticate request
        if not self.authenticate(request):
            raise Unauthorized()
        # Pass to next middleware
        if self.next:
            return self.next.handle(request)
        return request

# Usage: auth -> rate_limit -> logging -> service
```

---

### 11. Command Pattern

**What it is**: Encapsulates a request as an object, allowing parameterization and queuing of requests.

**Where it's used**:
- `services/schedule_service/commands/` - CRUD operations

**Why we use it**:
- Encapsulates operations (create, update, delete)
- Supports undo/redo functionality
- Can queue operations for async processing
- Makes operations first-class objects

**Example Structure**:
```python
class ICommand(ABC):
    @abstractmethod
    def execute(self):
        pass
    
    @abstractmethod
    def undo(self):
        pass

class CreateClassCommand(ICommand):
    def __init__(self, repository, class_data):
        self.repository = repository
        self.class_data = class_data
        self.created_class = None
    
    def execute(self):
        self.created_class = self.repository.create(self.class_data)
        return self.created_class
    
    def undo(self):
        if self.created_class:
            self.repository.delete(self.created_class.id)
```

---

### 12. Template Method Pattern

**What it is**: Defines the skeleton of an algorithm in a method, deferring some steps to subclasses.

**Where it's used**:
- Base service classes (implicitly in service structure)

**Why we use it**:
- Defines common service structure
- Allows customization of specific steps
- Reduces code duplication

**Example Structure**:
```python
class BaseService(ABC):
    def process_request(self, request):
        # Template method
        self.validate(request)
        result = self.execute(request)
        self.log(result)
        return result
    
    @abstractmethod
    def execute(self, request):
        pass  # Subclasses implement
```

---

## Concurrency Patterns

### 13. Producer-Consumer Pattern

**What it is**: Separates the production of data from its consumption.

**Where it's used**:
- `services/ai_service/consumer/` - Message consumer
- Message Broker (RabbitMQ/Kafka) - External service

**Why we use it**:
- Decouples frame capture (Edge Agent) from processing (AI Service)
- Handles load spikes (queue buffers requests)
- Allows async processing
- Enables horizontal scaling

**Example Structure**:
```python
# Producer (Edge Agent)
def capture_and_send():
    frame = camera.capture()
    message_broker.publish("face_recognition_queue", frame)

# Consumer (AI Service)
def consume_frames():
    for message in message_broker.consume("face_recognition_queue"):
        process_frame(message)
```

---

### 14. Circuit Breaker Pattern

**What it is**: Prevents cascading failures by stopping requests to a failing service.

**Where it's used**:
- `api_gateway/middleware/circuit_breaker.py`

**Why we use it**:
- Prevents overwhelming failing services
- Fails fast when service is down
- Allows service recovery time
- Prevents cascading failures

**Example Structure**:
```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.state = "closed"  # closed, open, half-open
    
    def call(self, func):
        if self.state == "open":
            raise CircuitOpenException()
        
        try:
            result = func()
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise
```

---

## Data Patterns

### 15. Cache-Aside Pattern

**What it is**: Application loads data from cache, if not found, loads from database and stores in cache.

**Where it's used**:
- `services/schedule_service/cache/schedule_cache.py`
- `shared/cache/cache_manager.py`

**Why we use it**:
- Improves read performance
- Reduces database load
- Automatic cache invalidation on updates
- Simple to implement

**Example Structure**:
```python
def get_schedule(user_id: UUID):
    # Try cache first
    cached = cache.get(f"schedule:{user_id}")
    if cached:
        return cached
    
    # Load from database
    schedule = repository.find_by_user(user_id)
    
    # Store in cache
    cache.set(f"schedule:{user_id}", schedule, ttl=300)
    
    return schedule
```

---

## Pattern Interaction Diagram

```
Client Request
    ↓
API Gateway (Facade + Proxy)
    ├── Middleware Chain (Chain of Responsibility)
    │   ├── Auth Middleware (Strategy: JWT/API Key)
    │   ├── Rate Limit Middleware
    │   ├── Circuit Breaker
    │   └── Logging Middleware
    └── Route to Service
        ↓
Microservice
    ├── Service Layer
    ├── Repository (Repository Pattern)
    ├── Database (Singleton Connection)
    └── Cache (Singleton + Cache-Aside)
```

---

## Benefits Summary

| Pattern | Benefit |
|---------|---------|
| Singleton | Resource efficiency, single instance |
| Factory | Encapsulates creation, easy extension |
| Repository | Testability, abstraction |
| Adapter | Library/hardware flexibility |
| Facade | Simplifies complex systems |
| Proxy | Cross-cutting concerns |
| Observer | Real-time updates, decoupling |
| State | Controlled transitions, validation |
| Strategy | Algorithm flexibility, no conditionals |
| Chain of Responsibility | Separation of concerns |
| Command | Encapsulation, undo/redo |
| Producer-Consumer | Decoupling, async processing |
| Circuit Breaker | Fault tolerance |
| Cache-Aside | Performance improvement |

---

## When to Use Each Pattern

- **Singleton**: When you need exactly one instance (DB, cache, config)
- **Factory**: When object creation is complex or varies by type
- **Repository**: When you want to abstract data access
- **Adapter**: When integrating incompatible interfaces
- **Facade**: When simplifying complex subsystems
- **Proxy**: When adding cross-cutting concerns
- **Observer**: When multiple objects need to react to changes
- **State**: When object behavior changes with state
- **Strategy**: When you have multiple algorithms to choose from
- **Chain of Responsibility**: When processing requests through multiple handlers
- **Command**: When you need to encapsulate operations
- **Producer-Consumer**: When decoupling production and consumption
- **Circuit Breaker**: When protecting against cascading failures
- **Cache-Aside**: When improving read performance

