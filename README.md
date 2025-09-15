
# Backstage RHDH Plugin Pipeline 

## Backstage Vanilla App

This repository contains a **vanilla Backstage application**, scaffolded using the official Backstage CLI.  
Backstage is an open platform for building developer portals that bring together your software catalog, documentation, and developer tools.

---

## 🚀 Getting Started

### 1. Install Dependencies
Install all required dependencies using **Yarn**:
```bash
yarn install
```

---

### 2. Start the Application
Run the development server:
```bash
yarn start
```

The app will start and be accessible at:
```
http://localhost:7007
```

The backend API runs on port `7007` by default.

---

## 🗂 Structure Overview

```
.
├── packages/        # Frontend and backend app code
│   ├── app/         # The main frontend application
│   └── backend/     # The backend services
│
├── plugins/         # Custom and community plugins
│
├── app-config.yaml  # Global configuration file
└── package.json     # Project dependencies
```

---

## ⚙️ Configuration
All configuration is handled in `app-config.yaml` and optional environment-specific files such as `app-config.local.yaml`.

Examples of common settings:
- **Base URLs** for the app and backend
- Authentication providers (e.g., GitHub, Google, Keycloak)
- Database connections for the backend

For detailed configuration options, see the [Backstage documentation](https://backstage.io/docs).

---

## 🧩 Plugins
Backstage functionality is built around **plugins**:
- Use built-in plugins like **Catalog**, **TechDocs**, and **Scaffolder**.
- Add third-party or custom plugins to extend the portal.

To create a new plugin:
```bash
yarn new
```

---

## 📚 Learn More
- [Backstage Documentation](https://backstage.io/docs)
- [Backstage GitHub Repository](https://github.com/backstage/backstage)
