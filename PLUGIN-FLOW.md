
# 🚀 Plugin Flow for Backstage & Red Hat Developer Hub

[![Backstage](https://img.shields.io/badge/Backstage-2.1-blueviolet?logo=backstage)](https://backstage.io)  
[![Red Hat Developer Hub](https://img.shields.io/badge/RHDH-CLI-red?logo=redhat)](https://developers.redhat.com/developer-hub)  
[![Made with Yarn](https://img.shields.io/badge/Yarn-4.9.2-blue?logo=yarn)](https://yarnpkg.com/)

> **A complete workflow to create, build, and deploy Backstage plugins in Red Hat Developer Hub (RHDH).**

---

## 📖 Table of Contents
- [🚀 Plugin Flow for Backstage \& Red Hat Developer Hub](#-plugin-flow-for-backstage--red-hat-developer-hub)
  - [📖 Table of Contents](#-table-of-contents)
  - [🌟 Overview](#-overview)
  - [🛠 Prerequisites](#-prerequisites)
  - [🚀 Getting Started](#-getting-started)
    - [1. Create a New Backstage App](#1-create-a-new-backstage-app)
    - [2. Configure Root `package.json`](#2-configure-root-packagejson)
    - [3. Install RHDH CLI](#3-install-rhdh-cli)
  - [🧩 Create Plugins](#-create-plugins)
  - [🏗 Build \& Export Plugins](#-build--export-plugins)
    - [1️⃣ Build to `dist` folder](#1️⃣-build-to-dist-folder)
    - [2️⃣ Export as Dynamic Plugin](#2️⃣-export-as-dynamic-plugin)
  - [📦 Package \& Deploy](#-package--deploy)
    - [1. Create `.tgz` file](#1-create-tgz-file)
    - [2. Copy plugin to OpenShift server](#2-copy-plugin-to-openshift-server)
    - [3. Generate SHA512 Integrity](#3-generate-sha512-integrity)

---

## 🌟 Overview

This guide walks you through:

- Creating a **Backstage app** from scratch.  
- Building **frontend** and **backend plugins**.  
- Packaging and deploying plugins to **OpenShift**.  
- Configuring **dynamic plugins** in RHDH.

---

## 🛠 Prerequisites

Make sure you have these installed:

| Tool | Version |
|------|----------|
| [Node.js](https://nodejs.org/) | 18.x or higher |
| [Yarn](https://yarnpkg.com/) | 4.9.2 |
| [Red Hat Developer Hub CLI](https://developers.redhat.com/developer-hub) | Latest |
| [OpenShift CLI (oc)](https://docs.openshift.com/) | Latest |

---

## 🚀 Getting Started

### 1. Create a New Backstage App
```bash
npx @backstage/create-app@latest
```

Example:
```bash
$ npx @backstage/create-app@latest
? Enter a name for the app [required] (backstage)
rhdh-dev-environment
```

Once created:
```bash
cd rhdh-dev-environment
yarn install
```

> 💡 **Tip:** If `yarn install` fails, run it again.

Run the app:
```bash
yarn start
```

---

### 2. Configure Root `package.json`

This ensures consistent plugin naming and scope:

```jsonc
{
  "backstage": {
    "cli": {
      "new": {
        "globals": {
          "namePrefix": "@irs/",
          "private": false,
          "license": "Apache-2.0"
        }
      }
    }
  }
}
```

---

### 3. Install RHDH CLI

```bash
npx @red-hat-developer-hub/cli
```

You'll see:
```
Need to install the following packages:
@red-hat-developer-hub/cli@1.7.2
Ok to proceed? (y) y
```

---

## 🧩 Create Plugins

Run the following to generate a new plugin:

```bash
yarn backstage-cli new
# or
yarn new
```

Choose the plugin type:
```
? What do you want to create? 
  scaffolder-backend-module  - Custom actions for @backstage/plugin-scaffolder-backend
  frontend-plugin            - A new frontend plugin
  backend-plugin             - A new backend plugin
  backend-plugin-module      - Extends an existing backend plugin
  plugin-web-library         - Shared functionality for web environments
  plugin-node-library        - Shared functionality for Node.js environments
```

---

## 🏗 Build & Export Plugins

Navigate to your plugin folder:

```bash
cd plugins/my-plugin
```

### 1️⃣ Build to `dist` folder
```bash
yarn build
```

### 2️⃣ Export as Dynamic Plugin
- **Frontend plugin:**
  ```bash
  npx @red-hat-developer-hub/cli@latest plugin export
  ```

- **Backend plugin:**
  ```bash
  npx @red-hat-developer-hub/cli@latest plugin export \
    --shared-package '!/@<plugin-name-from-package.json>' \
    --embed-package @<plugin-name-from-package.json>
  ```

---

## 📦 Package & Deploy

### 1. Create `.tgz` file
```bash
npm pack --json | head -n 10
```

Example output:
```
my-plugin-0.1.0.tgz
```

### 2. Copy plugin to OpenShift server
```bash
oc cp my-plugin-0.1.0.tgz httpd-svr-67bd8dd8b5-q67jw:/opt/app-root/src -n nell-dev
```

### 3. Generate SHA512 Integrity
```bash
openssl dgst -sha512 -binary your-plugin-name.tgz | openssl base64 -A
```

```
#app config yaml


### `app-config.yaml`
```yaml
dynamicPlugins:
  frontend:
    irs.plugin-front-end-test:
      dynamicRoutes:
        - path: /front-end-test
          importName: FrontEndTestPage
          menuItem:
            text: Front End Test
            icon: extension
      menuItems:
        front-end-test:
          title: Front End Test
          to: front-end-test
          priority: 25
          enabled: true
```

```
# dynamic plugins yaml

### `dynamic-plugins.yaml`
```yaml
includes:
  - dynamic-plugins.default.yaml

plugins:
  - package: http://httpd-svr-nell-dev.apps-crc.testing/irs-plugin-front-end-test-dynamic-0.1.0.tgz
    integrity: sha512-HKEY3eJWzVlzl6unr5ivoCvqtoOefOQ86AXvUkBNFRVpM7La+um1oU8gUxBGdD8ixwCzn+r3Y/dkzXfQcqFb0w==
    disabled: false
```