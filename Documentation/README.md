# Face Recognition Attendance System - Documentation

## Overview

This folder contains comprehensive documentation for the Face Recognition Attendance System, organized according to academic software engineering requirements.

## Document Structure

```
Documentation/
├── README.md                    # This file
├── SRS/                         # Software Requirements Specification
│   ├── 01_Preface.md           # Document information and conventions
│   ├── 02_Introduction.md      # System overview and objectives
│   ├── 03_Similar_Systems.md   # Comparison with existing solutions
│   ├── 04_Glossary.md          # Technical terms and definitions
│   ├── 05_Functional_User_Requirements.md    # User requirements (natural language)
│   ├── 06_Functional_System_Requirements.md  # System requirements (EARS patterns)
│   ├── 07_Non_Functional_Requirements.md     # Performance, security, usability
│   ├── 08_Prototypes.md        # UI page descriptions
│   ├── 09_Scenarios.md         # User workflow descriptions
│   ├── 10_Use_Cases.md         # Formal use case specifications
│   └── 11_Form_Specifications.md # Form-based and tabular specs
│
├── SDD/                         # Software Design Document
│   ├── 01_Overview.md          # Architecture overview
│   ├── 02_Design_Patterns.md   # Patterns used (7 patterns)
│   ├── 03_Architecture_Diagrams.md # Context, sequence, class diagrams
│   ├── 04_Data_Design.md       # Database schema and ERD
│   └── 05_Testing.md           # Test strategy and coverage
│
└── Project_Plan.md             # Task distribution and timeline
```

## Quick Links

### SRS Document (80 points)
| Section | Weight | File |
|---------|--------|------|
| Preface | 2 | [01_Preface.md](SRS/01_Preface.md) |
| Introduction | 3 | [02_Introduction.md](SRS/02_Introduction.md) |
| Similar Systems | 3 | [03_Similar_Systems.md](SRS/03_Similar_Systems.md) |
| Glossary | 2 | [04_Glossary.md](SRS/04_Glossary.md) |
| Functional User Requirements | 10 | [05_Functional_User_Requirements.md](SRS/05_Functional_User_Requirements.md) |
| Functional System Requirements | 10 | [06_Functional_System_Requirements.md](SRS/06_Functional_System_Requirements.md) |
| Non-functional Requirements | 10 | [07_Non_Functional_Requirements.md](SRS/07_Non_Functional_Requirements.md) |
| Prototypes | 20 | [08_Prototypes.md](SRS/08_Prototypes.md) |
| Scenarios | 10 | [09_Scenarios.md](SRS/09_Scenarios.md) |
| Use Cases | 5 | [10_Use_Cases.md](SRS/10_Use_Cases.md) |
| Form Specifications | 5 | [11_Form_Specifications.md](SRS/11_Form_Specifications.md) |

### SDD Document (25 points)
| Section | Weight | File |
|---------|--------|------|
| Automated Unit Tests | 5 | [05_Testing.md](SDD/05_Testing.md) |
| MVC Architecture | 5 | [01_Overview.md](SDD/01_Overview.md) |
| Data Validation | 5 | [04_Data_Design.md](SDD/04_Data_Design.md) |
| Implementation Conforms to Design | 5 | [02_Design_Patterns.md](SDD/02_Design_Patterns.md) |
| Clean Code | 5 | [02_Design_Patterns.md](SDD/02_Design_Patterns.md) |
| CRUD Operations | 5 | [06_Functional_System_Requirements.md](SRS/06_Functional_System_Requirements.md) |

### Design Viewpoints (10 points)
| Diagram | File |
|---------|------|
| Sequence Diagrams | [03_Architecture_Diagrams.md](SDD/03_Architecture_Diagrams.md) |
| Use Case Diagram | [10_Use_Cases.md](SRS/10_Use_Cases.md) |
| Class Diagram | [03_Architecture_Diagrams.md](SDD/03_Architecture_Diagrams.md) |
| Architecture Diagram | [03_Architecture_Diagrams.md](SDD/03_Architecture_Diagrams.md) |
| Data Design | [04_Data_Design.md](SDD/04_Data_Design.md) |
| UI Design | [08_Prototypes.md](SRS/08_Prototypes.md) |

### Project Implementation (50 points)
| Requirement | Evidence |
|-------------|----------|
| Using OOP | Classes throughout backend services |
| Design Patterns (7 used) | [02_Design_Patterns.md](SDD/02_Design_Patterns.md) |
| Dynamic Menu | Role-based sidebar navigation |
| Authentication (User Roles) | Student/Mentor/Admin RBAC |

### Bonus Items
| Item | Status |
|------|--------|
| Machine Learning for AI | ✅ InsightFace face recognition |
| Product Owner Feedback | ✅ Iterative development |
| Project Deployment | Docker-ready |
| HTTPS Support | Configurable |

## How to Use This Documentation

1. **For Evaluation**: Start with README.md, then review SRS and SDD folders
2. **For Development**: Reference specific sections as needed
3. **For Understanding**: Read Introduction → Glossary → Requirements → Design

## Document Conventions

- All diagrams use ASCII art for portability
- Requirements use EARS patterns (WHEN/THEN/SHALL)
- Use cases follow standard template format
- Code examples are in Python (backend) and TypeScript (frontend)
