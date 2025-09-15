## Common Issues

# Backstage Plugin Pipeline

This pipeline builds and packages **community plugins** for Red Hat Developer Hub (RHDH) or Backstage.
It supports integrating external plugins like RoadieHQ ArgoCD into your RHDH instance, ensuring they match the core Backstage version your environment uses.

When using community plugins, you may encounter:
- Placeholder dependencies like `"backstage:^"`,
- TypeScript version mismatches,
- Backstage API changes.

These issues must be resolved to ensure successful builds in CI/CD.

---

## Common Issues and Fixes

---

### 1. `backstage:^` Placeholder Versions

**Error Example:**

**Why this happens:**

- Community plugins often use `"backstage:^"` in their `package.json` to avoid hardcoding specific versions.
- This works **inside a full RHDH or Backstage app** because the root project already provides pinned versions like:
  ```json
  "@backstage/core-plugin-api": "1.31.4",
  "@backstage/frontend-plugin-api": "0.6.9"

1. ➤ YN0001: Error: @backstage/cli@backstage:^ isn't supported by any available resolver
   #### Fix: Provide latest working version of package.

1. src/alpha.ts:16:10 - error TS2305: Module '"@backstage/frontend-plugin-api"' has no exported member 'createFrontendPlugin'.
16 import { createFrontendPlugin } from '@backstage/frontend-plugin-api';
            ~~~~~~~~~~~~~~~~~~~~
   #### Fix: Upgrade version of module.




1. src/alpha/apis.tsx:14:5 - error TS2353: Object literal may only specify known properties, and 'factory' does not exist in type 'ParamsFactory<(<TApi, TImpl extends TApi, TDeps extends { [name in string]: unknown; }>(params: ApiFactory<TApi, TImpl, TDeps>) => ExtensionBlueprintParams<AnyApiFactory>)>'.

14     factory: createApiFactory({
       ~~~~~~~

  ../../node_modules/@backstage/frontend-plugin-api/dist/index.d.ts:754:9
    754         params: TParamsInput extends ExtensionBlueprintDefineParams ? TParamsInput : T['params'] extends ExtensionBlueprintDefineParams ? 'Error: This blueprint uses advanced parameter types and requires you to pass parameters as using the following callback syntax: `<blueprint>.make({ params: defineParams => defineParams(<params>) })`' : T['params'];
                ~~~~~~
   #### Fix: Check version of package and update.



       "@types/express": "*",

       Fix with real version for plugin.


Front end plugins ***

Error: Config validation failed, Config must have required property 'agentForge' { missingProperty=agentForge } at
Need to modify app config.yml