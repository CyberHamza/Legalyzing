export const systemDocs = [
    {
        id: 'intro',
        title: '1. Introduction',
        content: `
# Introduction
### 1.1 Purpose of the Document
This document provides a comprehensive technical and functional overview of the Legalyze platform. It serves as a single source of truth for understanding the system's architecture, intelligence layer, and operational workflows.

### 1.2 Scope of the System
Legalyze is an AI-driven ecosystem designed for the legal industry in Pakistan. It automates legal research via Retrieval-Augmented Generation (RAG), conducts constitutional compliance checks, and assists in case drafting through a structured wizard.
        `
    },
    {
        id: 'overview',
        title: '2. System Overview',
        content: `
# System Overview
### 2.1 System Vision and Objectives
To modernize the legal practice in Pakistan by providing instant, accurate, and constitutionally-grounded legal assistance.

### 2.2 System Use Case Diagram
Below is a high-level overview of the major user roles and their interactions with the system modules.

\`\`\`mermaid
useCaseDiagram
    actor "Super Admin" as SA
    actor "Admin" as A
    actor "Legal Professional" as LP
    
    package "Portal Sections" {
        usecase "Live Activity Monitoring" as UC1
        usecase "System Documentation Bible" as UC2
        usecase "User Permission Control" as UC3
        usecase "Knowledge Base Management" as UC4
        usecase "Intelligent Legal Chat (RAG)" as UC5
        usecase "Constitutional Compliance" as UC6
        usecase "Case Build-Up Wizard" as UC7
    }
    
    SA --> UC1
    SA --> UC2
    SA --> UC3
    SA --> UC4
    
    A --> UC3
    A --> UC4
    
    LP --> UC5
    LP --> UC6
    LP --> UC7
\`\`\`

### 2.5 Target Users
- **Lawyers & Advocates**: For case preparation and research.
- **Law Firms**: For internal knowledge management.
- **Super Admins**: For platform oversight.
        `
    },
    {
        id: 'architecture',
        title: '4. System Architecture',
        content: `
# System Architecture
### 4.1 Detailed System Architecture Diagram
The system follows a MERN + RAG multi-tier architecture, integrating external AI and Cloud storage services.

\`\`\`mermaid
graph TD
    subgraph "Client Layer (React)"
        UI["User Interface (MUI + Framer)"]
        State["State Management (Context API)"]
    end

    subgraph "API Layer (Node/Express)"
        Router["Express Router"]
        Auth["Auth Middleware (JWT/OAuth)"]
        Controllers["Feature Controllers"]
    end

    subgraph "Data & Knowledge Layer"
        DB[(MongoDB - Metadata)]
        Pinecone[(Pinecone - Vector Store)]
        S3["AWS S3 - Legal Document Store"]
    end

    subgraph "AI Core Layer"
        OpenAI["OpenAI GPT-4o Engine"]
        Embedding["Text-Embedding-3-Small"]
    end

    UI <--> Router
    Router --> Auth
    Auth --> Controllers
    Controllers --> DB
    Controllers --> OpenAI
    Controllers --> Pinecone
    Controllers --> S3
    OpenAI <--> Embedding
\`\`\`

### 4.2 Logical Architecture
- **Presentation Layer**: React.js / Material UI.
- **Application Layer**: Node.js / Express.js.
- **Data Layer**: MongoDB / Pinecone / AWS S3.
        `
    },
    {
        id: 'ai-layer',
        title: '6. AI & Intelligence Layer',
        content: `
# AI and Intelligence Layer
### 6.1 RAG Pipeline Sequence Diagram
This interaction shows how the system "finds" legal truth using Retrieval-Augmented Generation.

\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant B as Backend (API)
    participant E as OpenAI (Embedding)
    participant V as Pinecone (Vector DB)
    participant L as OpenAI (GPT-4o)

    U->>B: Sends Legal Query
    B->>E: Convert Query to 1536-dim Vector
    E-->>B: Return Numerical Embedding
    B->>V: Search for Top-K Similar Law Segments
    V-->>B: Return Relevant Legal Context
    B->>L: Payload: [Context + Legal Query + Persona]
    L-->>B: Generate Factually Grounded Answer
    B->>U: Deliver AI Response with Citations
\`\`\`

### 6.2 AI Design Philosophy
"Grounded Intelligence." The AI is not allowed to speak from its own generic knowledge alone; it must cite the Knowledge Base.
        `
    },
    {
        id: 'functional-modules',
        title: '5. Core Functional Modules',
        content: `
# Core Functional Modules
### 5.1 User Authentication and Authorization
Multi-layered security using JWT for sessions and Google OAuth 2.0.

### 5.2 Case Intake and Case Facts Analysis
A dedicated intake module that extracts and summarizes core facts from user descriptions.

### 5.5 Petition Drafting and Document Generation
Compiles user data into legal templates, rendered via Markdown and professional MUI components.
        `
    },
    {
        id: 'petition-mgmt',
        title: '7. Petition Management System',
        content: `
# Petition Management System
### 7.1 Supported Petition Types
- Writ Petitions (Article 199).
- Civil Revisions.
- Bail Applications.
- Family Matters.
        `
    },
    {
        id: 'admin-panel',
        title: '9. Admin Panel & Controls',
        content: `
# Admin Panel and System Control
### 9.1 Admin Roles and Privileges
- **Super Admin**: System Pulse, Financials, Global Settings.
- **Admin**: User management, Compliance oversight.
        `
    },
    {
        id: 'security-compliance',
        title: '11. Security & Compliance',
        content: `
# Security and Compliance
### 11.1 Data Security Measures
Encryption at rest (MongoDB Atlas/AWS S3) and in transit (HTTPS/SSL).

### 11.2 User Data Privacy
PII is strictly isolated and accessible only to authorized sessions.
        `
    },
    {
        id: 'future',
        title: '18. Future Enhancements',
        content: `
# Future Enhancements
### 18.1 Additional Petition Types
Expansion into Family Law, Rent Disputes, and Labour Law.

### 18.3 Multilingual Support (Urdu / English)
Full UI and document generation in the national language, Urdu.
        `
    }
];
