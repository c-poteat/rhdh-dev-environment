
# Backstage RHDH Plugin Pipeline

This GitHub Actions workflow automates the process of **building and packaging **Custom**, Red Hat Developer Hub (RHDH)** and **Backstage community plugins**.

It:
1. **Compiles a plugin** using TypeScript,
2. **Exports it** using the RHDH CLI,
3. **Packages it** into a `.tgz` tarball,
4. **Uploads it** to an OpenShift pod,
5. **Updates the RHDH `dynamic-plugins.yaml` ConfigMap**, and
6. **Restarts RHDH** to load the new plugin.

---

## 📂 Repository Structure

```
.
├── plugins/
│   ├── my-plugin/           # Each plugin lives here
│   │   ├── package.json     # Must have pinned versions (not root)
│   │   └── src/
│   └── another-plugin/
│
├── tsconfigs/               # TypeScript templates
│   ├── tsconfig.backend.json    # For backend plugins
│   ├── tsconfig.frontend.json   # For frontend plugins
│   └── tsconfig.base.json       # Shared base configuration
│
├── scripts/
│   └── process-plugin.js    # Core build and packaging script
│
├── processed/               # Output directory for packaged plugins
│
├── .github/workflows/
│   └── rhdh-plugin-pipeline.yml
│
└── package.json             # Root Backstage app dependencies
```

---

## 🚀 Running the Pipeline

### 1. Requirements
- **GitHub Secrets:**
  - `GIT_TOKEN` – Token to push changes to `main`.
  - `OC_LOGIN_TOKEN` – OpenShift login token for `oc login`.

- **Pinned Backstage Versions in Each Plugin**  
  Each **plugin’s own `package.json`** must specify exact versions for Backstage dependencies.  
  Example for `plugins/my-plugin/package.json`:
  ```json
  {
    "@backstage/core-plugin-api": "1.31.4",
    "@backstage/frontend-plugin-api": "0.6.9",
    "@backstage/backend-plugin-api": "1.0.13",
    "@types/express": "4.17.21"
  }
  ```

  > ❗ Community plugins often use `"backstage:^"` or `"*"` placeholders.  
  > These **must be replaced** with exact versions to prevent runtime and build errors.

---

### 2. Trigger the Workflow
The workflow triggers automatically on:
- Pushes or PRs to `main` affecting:
  - `plugins/**`
  - `packages/**`
  - `.yarn/**`
  - `scripts/**`
  - `package.json`
  - `yarn.lock`

Or manually via **GitHub Actions → Run Workflow**.

---

### 3. One Plugin at a Time
Currently, the pipeline **only processes one plugin per run**:
- Place a single plugin in `plugins/`
- Ensure its `package.json` has correct pinned versions.
- Run the pipeline
- Verify success
- Add the next plugin and repeat.

---

## 🛠️ How It Works

### Step-by-step
1. **Yarn Install**
   ```bash
   node .yarn/releases/yarn-<version>.cjs install --mode=skip-build --no-immutable
   ```

2. **Process Plugin**
   ```bash
   node scripts/process-plugin.js <plugin-folder-name>
   ```
   This:
   - Generates a `tsconfig.json` for the plugin,
   - Compiles the plugin with `tsc`,
   - Exports using `@red-hat-developer-hub/cli`,
   - Packages into `processed/<plugin-name>.tgz`,
   - Outputs metadata to `.yml`.

3. **Copy to OpenShift Pod**
   - Finds the pod labeled `httpd-example` in the `poteatc-dev` namespace,
   - Uploads `.tgz` files to `/opt/app-root/src`.

4. **Update ConfigMap**
   - Adds or updates `dynamic-plugins.yaml` with the new plugin package URL and integrity hash.

5. **Restart RHDH**
   ```bash
   oc rollout restart deploy/redhat-developer-hub
   ```

---

## 📄 Understanding `tsconfigs/`

The `tsconfigs/` directory contains **TypeScript configuration templates** used to compile plugins consistently.

### Files:
- **`tsconfig.base.json`**  
  - Provides shared defaults for **both frontend and backend** plugins.
  - Contains rules for strict type-checking, module resolution, and output directories.

- **`tsconfig.frontend.json`**  
  - Extends `tsconfig.base.json`.
  - Tailored for **frontend plugins**, using browser-friendly module targets.
  - Includes JSX and React-specific settings required by Backstage UI components.
  - Ensures compiled code works properly with Backstage's frontend runtime.

- **`tsconfig.backend.json`**  
  - Extends `tsconfig.base.json`.
  - Configured for **backend plugins**, using Node.js targets.
  - Includes type definitions for Node APIs like `fs`, `path`, and Express.

---

### How It Works in the Pipeline
1. **When processing a plugin**, the script detects the plugin type from its `package.json`:
   ```json
   {
     "backstage": {
       "role": "frontend-plugin"
     }
   }
   ```
2. Based on the `role`:
   - If it's a **frontend plugin**, it copies `tsconfig.frontend.json` → `<plugin>/tsconfig.json`.
   - If it's a **backend plugin**, it copies `tsconfig.backend.json` → `<plugin>/tsconfig.json`.
3. The `__PLUGIN_NAME__` placeholder inside the template is automatically replaced with the actual plugin folder name.
4. This ensures:
   - Consistent builds across all plugins.
   - Easy debugging of TypeScript errors without custom configs per plugin.

---

### Example Generated `tsconfig.json`
For a plugin named `roadie-argocd`:
```json
{
  "extends": "../tsconfigs/tsconfig.frontend.json",
  "compilerOptions": {
    "outDir": "../../dist-types/plugins/roadie-argocd"
  },
  "include": ["src"],
  "references": []
}
```

---

## 🐛 Common Issues & Fixes

### 1. `backstage:^` Placeholder Versions in Plugin `package.json`
**Error Example:**
```
➤ YN0001: Error: @backstage/cli@backstage:^ isn't supported by any available resolver
```

**Cause:**  
The **plugin's `package.json`** uses `"backstage:^"` which causes mismatched dependencies during build.

**Fix:**  
Update **plugin’s `package.json`** to use exact versions:
```json
"@backstage/core-plugin-api": "1.31.4",
"@backstage/frontend-plugin-api": "0.6.9"
```

---

### 2. Missing TypeScript Types
**Error Example:**
```
"@types/express": "*",
```

**Fix:**  
Replace `"*"` with a pinned version in the plugin:
```json
"@types/express": "4.17.21"
```

---

### 3. API Changes Between Versions
**Error Example:**
```
src/alpha.ts:16:10 - error TS2305: Module '"@backstage/frontend-plugin-api"' 
has no exported member 'createFrontendPlugin'.
```

**Fix:**
- Upgrade `@backstage/frontend-plugin-api` **inside the plugin**:
  ```bash
  cd plugins/my-plugin
  yarn add @backstage/frontend-plugin-api@latest
  ```
- Update code to match current API.

---

### 4. Config Validation Failure
**Error Example:**
```
Error: Config validation failed, Config must have required property 'agentForge'
```

**Fix:**  
Add the required property to `app-config.yaml`:
```yaml
agentForge:
  baseUrl: http://127.0.0.1:8000
```


---

## 📌 Best Practices

- **Pin versions inside the plugin folder**:
  Each plugin must have exact versions to prevent breaks.
  
- **Process one plugin at a time**:
  Avoid multiple plugins until the pipeline supports batching.

- **Keep RHDH CLI up-to-date**:
  ```bash
  npx @red-hat-developer-hub/cli@latest
  ```

- **Backup ConfigMap before patching:**
  ```bash
  oc -n <project> get cm redhat-developer-hub-dynamic-plugins -o yaml > backup.yaml
  ```

---

## Example Success Run

```
=== Processing my-plugin ===
📦 Plugin Name: @example/my-plugin
🔹 Plugin Type: frontend-plugin
📄 Copied tsconfig template → plugins/my-plugin/tsconfig.json
✅ Compilation completed successfully for my-plugin
🚀 Exporting frontend plugin...
📦 Packaging plugin into .tgz...
✅ Packed plugin: processed/my-plugin.tgz
✅ ConfigMap updated successfully.
🔄 Restarting deployment redhat-developer-hub
🎉 Plugin my-plugin successfully processed!
```

---

## Next Steps

- Pin plugin dependency versions early to prevent build failures.
- Add more plugins incrementally.
- Expand pipeline to process multiple plugins in one run.
