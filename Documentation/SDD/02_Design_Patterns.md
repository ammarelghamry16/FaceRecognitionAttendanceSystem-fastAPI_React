# Design Patterns

## 2.1 Overview

This system implements multiple design patterns to ensure maintainability, extensibility, and clean code architecture. Below are the patterns used with their implementations.

---

## 2.2 Repository Pattern

### Purpose
Abstracts data access logic from business logic, providing a clean separation of concerns.

### Implementation

```python
# Base Repository Interface
class IRepository(ABC, Generic[T]):
    @abstractmethod
    def get_by_id(self, id: UUID) -> Optional[T]: pass
    
    @abstractmethod
    def get_all(self) -> List[T]: pass
    
    @abstractmethod
    def create(self, entity: T) -> T: pass
    
    @abstractmethod
    def update(self, entity: T) -> T: pass
    
    @abstractmethod
    def delete(self, id: UUID) -> bool: pass

# Concrete Implementation
class UserRepository(IRepository[User]):
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, id: UUID) -> Optional[User]:
        return self.db.query(User).filter(User.id == id).first()
    
    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()
    
    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
```

### Class Diagram

```
┌─────────────────────────────┐
│     <<interface>>           │
│       IRepository           │
├─────────────────────────────┤
│ + get_by_id(id): T          │
│ + get_all(): List[T]        │
│ + create(entity): T         │
│ + update(entity): T         │
│ + delete(id): bool          │
└─────────────┬───────────────┘
              │
              │ implements
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼───────────┐  ┌────▼──────────┐
│UserRepository │  │ClassRepository│
├───────────────┤  ├───────────────┤
│- db: Session  │  │- db: Session  │
├───────────────┤  ├───────────────┤
│+ get_by_email │  │+ get_by_day   │
│+ get_by_role  │  │+ get_by_mentor│
└───────────────┘  └───────────────┘
```

### Where Used
- UserRepository, APIKeyRepository (Auth Service)
- CourseRepository, ClassRepository, EnrollmentRepository (Schedule Service)
- SessionRepository, AttendanceRepository (Attendance Service)
- FaceEncodingRepository, UserCentroidRepository (AI Service)
- NotificationRepository (Notification Service)

---

## 2.3 Strategy Pattern

### Purpose
Defines a family of algorithms, encapsulates each one, and makes them interchangeable.

### Implementation

```python
# Strategy Interface
class IAuthStrategy(ABC):
    @abstractmethod
    def authenticate(self, credentials: Any) -> Optional[User]: pass
    
    @abstractmethod
    def validate_token(self, token: str) -> Optional[Dict]: pass

# JWT Strategy
class JWTAuthStrategy(IAuthStrategy):
    def __init__(self, token_service: TokenService):
        self.token_service = token_service
    
    def authenticate(self, credentials: LoginRequest) -> Optional[User]:
        # Validate credentials and return user
        pass
    
    def validate_token(self, token: str) -> Optional[Dict]:
        return self.token_service.decode_token(token)

# API Key Strategy
class APIKeyAuthStrategy(IAuthStrategy):
    def __init__(self, api_key_repo: APIKeyRepository):
        self.api_key_repo = api_key_repo
    
    def authenticate(self, credentials: str) -> Optional[User]:
        api_key = self.api_key_repo.get_by_key(credentials)
        return api_key.user if api_key else None
    
    def validate_token(self, token: str) -> Optional[Dict]:
        # API keys don't use tokens
        return None
```

### Class Diagram

```
┌─────────────────────────────┐
│     <<interface>>           │
│      IAuthStrategy          │
├─────────────────────────────┤
│ + authenticate(creds): User │
│ + validate_token(token): Dict│
└─────────────┬───────────────┘
              │
              │ implements
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼───────────┐  ┌────▼──────────┐
│JWTAuthStrategy│  │APIKeyStrategy │
├───────────────┤  ├───────────────┤
│- token_service│  │- api_key_repo │
├───────────────┤  ├───────────────┤
│+ authenticate │  │+ authenticate │
│+ validate     │  │+ validate     │
└───────────────┘  └───────────────┘
```

### Where Used
- Authentication (JWT vs API Key)
- Schedule filtering (Student vs Mentor vs Admin)

---

## 2.4 State Pattern

### Purpose
Allows an object to alter its behavior when its internal state changes.

### Implementation

```python
# State Interface
class ISessionState(ABC):
    @abstractmethod
    def start(self, session: AttendanceSession) -> None: pass
    
    @abstractmethod
    def end(self, session: AttendanceSession) -> None: pass
    
    @abstractmethod
    def mark_attendance(self, session: AttendanceSession, 
                        student_id: UUID, status: str) -> None: pass

# Concrete States
class InactiveState(ISessionState):
    def start(self, session: AttendanceSession) -> None:
        session.state = "active"
        session.start_time = datetime.utcnow()
    
    def end(self, session: AttendanceSession) -> None:
        raise InvalidStateError("Cannot end inactive session")
    
    def mark_attendance(self, session, student_id, status) -> None:
        raise InvalidStateError("Cannot mark attendance in inactive session")

class ActiveState(ISessionState):
    def start(self, session: AttendanceSession) -> None:
        raise InvalidStateError("Session already active")
    
    def end(self, session: AttendanceSession) -> None:
        session.state = "completed"
        session.end_time = datetime.utcnow()
    
    def mark_attendance(self, session, student_id, status) -> None:
        # Update attendance record
        pass

class CompletedState(ISessionState):
    def start(self, session: AttendanceSession) -> None:
        raise InvalidStateError("Cannot restart completed session")
    
    def end(self, session: AttendanceSession) -> None:
        raise InvalidStateError("Session already completed")
    
    def mark_attendance(self, session, student_id, status) -> None:
        raise InvalidStateError("Cannot modify completed session")
```

### State Diagram

```
                    ┌─────────────┐
                    │   INACTIVE  │
                    │             │
                    └──────┬──────┘
                           │
                           │ start()
                           ▼
                    ┌─────────────┐
         ┌─────────│   ACTIVE    │─────────┐
         │         │             │         │
         │         └──────┬──────┘         │
         │                │                │
         │ mark_attendance│                │ end()
         │                │                │
         └────────────────┘                ▼
                                   ┌─────────────┐
                                   │  COMPLETED  │
                                   │             │
                                   └─────────────┘
```

### Where Used
- Attendance Session Management

---

## 2.5 Factory Pattern

### Purpose
Creates objects without specifying the exact class to create.

### Implementation

```python
class NotificationFactory:
    @staticmethod
    def create_class_started(class_name: str, mentor_name: str, 
                             user_id: UUID) -> Notification:
        return Notification(
            user_id=user_id,
            type="class_started",
            title="Class Started",
            message=f"{class_name} has started with {mentor_name}"
        )
    
    @staticmethod
    def create_attendance_marked(class_name: str, status: str,
                                 user_id: UUID) -> Notification:
        return Notification(
            user_id=user_id,
            type="attendance_marked",
            title="Attendance Marked",
            message=f"You were marked {status} for {class_name}"
        )
    
    @staticmethod
    def create_session_ended(class_name: str, ended_by: str,
                            user_id: UUID) -> Notification:
        return Notification(
            user_id=user_id,
            type="session_ended",
            title="Session Ended",
            message=f"{class_name} session ended by {ended_by}"
        )
```

### Class Diagram

```
┌─────────────────────────────────────┐
│        NotificationFactory          │
├─────────────────────────────────────┤
│ + create_class_started(): Notif     │
│ + create_attendance_marked(): Notif │
│ + create_session_ended(): Notif     │
│ + create_schedule_updated(): Notif  │
└─────────────────┬───────────────────┘
                  │
                  │ creates
                  ▼
         ┌─────────────────┐
         │   Notification  │
         ├─────────────────┤
         │ - id            │
         │ - user_id       │
         │ - type          │
         │ - title         │
         │ - message       │
         │ - is_read       │
         │ - created_at    │
         └─────────────────┘
```

### Where Used
- Notification Service (creating different notification types)

---

## 2.6 Observer Pattern

### Purpose
Defines a one-to-many dependency between objects so that when one object changes state, all its dependents are notified.

### Implementation

```python
# Subject
class NotificationSubject:
    def __init__(self):
        self._observers: List[INotificationObserver] = []
    
    def attach(self, observer: INotificationObserver) -> None:
        self._observers.append(observer)
    
    def detach(self, observer: INotificationObserver) -> None:
        self._observers.remove(observer)
    
    def notify(self, notification: Notification) -> None:
        for observer in self._observers:
            observer.update(notification)

# Observer Interface
class INotificationObserver(ABC):
    @abstractmethod
    def update(self, notification: Notification) -> None: pass

# Concrete Observer
class WebSocketObserver(INotificationObserver):
    def __init__(self, connection_manager: ConnectionManager):
        self.connection_manager = connection_manager
    
    def update(self, notification: Notification) -> None:
        asyncio.create_task(
            self.connection_manager.send_to_user(
                notification.user_id,
                notification.dict()
            )
        )
```

### Class Diagram

```
┌─────────────────────────────┐
│    NotificationSubject      │
├─────────────────────────────┤
│ - observers: List[Observer] │
├─────────────────────────────┤
│ + attach(observer)          │
│ + detach(observer)          │
│ + notify(notification)      │
└─────────────┬───────────────┘
              │
              │ notifies
              ▼
┌─────────────────────────────┐
│     <<interface>>           │
│  INotificationObserver      │
├─────────────────────────────┤
│ + update(notification)      │
└─────────────┬───────────────┘
              │
              │ implements
              ▼
┌─────────────────────────────┐
│    WebSocketObserver        │
├─────────────────────────────┤
│ - connection_manager        │
├─────────────────────────────┤
│ + update(notification)      │
└─────────────────────────────┘
```

### Where Used
- Real-time WebSocket notifications

---

## 2.7 Adapter Pattern

### Purpose
Converts the interface of a class into another interface clients expect.

### Implementation

```python
# Target Interface
class IFaceRecognitionAdapter(ABC):
    @abstractmethod
    def detect_faces(self, image: np.ndarray) -> List[Face]: pass
    
    @abstractmethod
    def get_embedding(self, face: Face) -> np.ndarray: pass
    
    @abstractmethod
    def compare_embeddings(self, emb1: np.ndarray, 
                          emb2: np.ndarray) -> float: pass

# Adapter for InsightFace
class InsightFaceAdapter(IFaceRecognitionAdapter):
    def __init__(self):
        self.app = FaceAnalysis(name='buffalo_l')
        self.app.prepare(ctx_id=0)
    
    def detect_faces(self, image: np.ndarray) -> List[Face]:
        faces = self.app.get(image)
        return [self._convert_face(f) for f in faces]
    
    def get_embedding(self, face: Face) -> np.ndarray:
        return face.embedding
    
    def compare_embeddings(self, emb1: np.ndarray, 
                          emb2: np.ndarray) -> float:
        return np.dot(emb1, emb2) / (
            np.linalg.norm(emb1) * np.linalg.norm(emb2)
        )
```

### Class Diagram

```
┌─────────────────────────────────┐
│        <<interface>>            │
│    IFaceRecognitionAdapter      │
├─────────────────────────────────┤
│ + detect_faces(image): List     │
│ + get_embedding(face): ndarray  │
│ + compare_embeddings(): float   │
└─────────────┬───────────────────┘
              │
              │ implements
              ▼
┌─────────────────────────────────┐
│      InsightFaceAdapter         │
├─────────────────────────────────┤
│ - app: FaceAnalysis             │
├─────────────────────────────────┤
│ + detect_faces(image)           │
│ + get_embedding(face)           │
│ + compare_embeddings()          │
└─────────────────────────────────┘
```

### Where Used
- Face Recognition (InsightFace library integration)
- Camera Capture (OpenCV integration)

---

## 2.8 Singleton Pattern

### Purpose
Ensures a class has only one instance and provides a global point of access to it.

### Implementation

```python
class DatabaseConnection:
    _instance = None
    _engine = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._engine = create_engine(settings.DATABASE_URL)
        return cls._instance
    
    @property
    def engine(self):
        return self._engine
    
    def get_session(self):
        SessionLocal = sessionmaker(bind=self._engine)
        return SessionLocal()
```

### Where Used
- Database Connection
- Cache Manager
- Face Recognition Model (loaded once)

---

## 2.9 Pattern Summary

| Pattern | Purpose | Location |
|---------|---------|----------|
| Repository | Data access abstraction | All services |
| Strategy | Interchangeable algorithms | Auth, Schedule |
| State | State-dependent behavior | Attendance sessions |
| Factory | Object creation | Notifications |
| Observer | Event notification | WebSocket |
| Adapter | Interface conversion | Face recognition |
| Singleton | Single instance | DB, Cache, AI Model |
