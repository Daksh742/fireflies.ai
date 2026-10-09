# Fireflies.ai — Meeting Intelligence Platform

A full-stack meeting intelligence application inspired by Fireflies.ai, built as part of the Scaler SDE Fullstack Assignment.

The application provides a centralized workspace for reviewing meetings, exploring transcripts, accessing summaries and action items, searching across meeting content, and interacting with meeting information through an AI-powered assistant.

## Key Features

* **Meeting Library:** Browse, organize, and access meeting records.
* **Global Search:** Search across meetings and available meeting content, including transcripts, summaries, topics, and action items.
* **AI Meeting Assistant:** Ask questions about meeting content and receive contextual answers grounded in available meeting data.
* **Transcript & Audio Navigation:** Explore timestamped transcripts and navigate to relevant points in a recording where supported.
* **Meeting Summaries:** Review key takeaways and important discussion points.
* **Topics & Action Items:** Identify discussion topics and review follow-up tasks.
* **Export:** Export supported meeting information, such as transcripts, summaries, and notes.
* **Dark Mode:** Switch between light and dark themes for a comfortable viewing experience.
* **Responsive UI/UX:** A polished SaaS interface with consistent typography, spacing, accessible interactions, and clear feedback states.
* **Reliable CRUD Operations:** Create, view, update, and delete supported records with appropriate validation and error handling.

Refer to `FEATURES.md` for the detailed feature inventory and implementation status.

## Documentation

The following documents provide a detailed overview of the product requirements, implementation, architecture, features, and database design.

### 1. Project Structure

[**PROJECT_STRUCTURE.md**](PROJECT_STRUCTURE.md)

The project directory tree, frontend and backend organization, file responsibilities, routes, components, services, configuration, tests, and assets.

### 2. Product Requirements Document (PRD)

[**PRD.md**](PRD.md)

The product vision, problem statement, goals, target users, scope, requirements, user journeys, constraints, and future improvements.

### 3. Functional Requirements Document (FRD)

[**FRD.md**](FRD.md)

Functional specifications, user interactions, expected system behavior, validation rules, API dependencies, error handling, and acceptance criteria.

### 4. Complete Feature Inventory

[**FEATURES.md**](FEATURES.md)

A detailed inventory of UI areas, controls, interactions, API capabilities, global search, the AI assistant, exports, comments and highlights, themes, notifications, and implementation and testing status.

### 5. Database Schema

[**DATABASE_SCHEMA.md**](DATABASE_SCHEMA.md)

Database tables, columns, SQLite types, primary and foreign keys, indexes, constraints, entity relationships, and the ER diagram.

## Technology Stack

The project uses:

* **Frontend:** Next.js, React, TypeScript, native CSS/CSS Modules
* **Backend:** FastAPI,Python and SQLAlcheme
* **Database:** SQLite

Refer to the project configuration for the exact dependency versions and current implementation details.

## Repository Structure

```text
Firefiles.ai/
├── frontend/               # Next.js frontend application
├── backend/                # FastAPI backend application
├── README.md               # Project overview and setup
├── PROJECT_STRUCTURE.md    # Codebase reference
├── PRD.md                  # Product requirements
├── FRD.md                  # Functional requirements
├── FEATURES.md             # Feature inventory
└── DATABASE_SCHEMA.md      # Database reference
```

## Getting Started

### Prerequisites

* Node.js and npm
* Python and pip
* The dependencies and runtime versions required by the project

### Setup

1. Clone the repository.
2. Install the frontend dependencies from the `frontend/` directory.
3. Install the backend dependencies using the backend's dependency configuration.
4. Configure the required environment variables.
5. Initialize the database if required.
6. Start the backend and frontend using their documented commands.

See the frontend and backend directories for the exact setup instructions and available commands.

## Engineering Principles

* Keep UI components separate from business logic.
* Validate inputs and handle API failures consistently.
* Persist application data through the backend.
* Provide clear loading, empty, success, and error states.
* Keep the interface responsive and accessible.
* Verify feature behavior through testing before marking it as complete.

## Project Status

Refer to [**FEATURES.md**](FEATURES.md) for the implementation inventory, verification status, known limitations, and outstanding work.

Features should be considered implemented and verified only where supported by actual application behavior and testing evidence.

## Scope

The project focuses on the meeting-intelligence workflows required by the assignment. Additional integrations, external AI services, or functionality beyond the approved requirements should only be introduced when justified and permitted by the assignment.

## License

Created as part of the Scaler SDE Fullstack Assignment.
