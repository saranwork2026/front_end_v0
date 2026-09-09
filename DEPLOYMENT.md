# New-FE Deployment

New-FE is a standalone Vite React SPA. It deploys to the **same** S3 bucket and
CloudFront distribution as the current magizhmatrimony frontend.

| Target | Value |
|--------|-------|
| S3 bucket | `magizhmatrimony` (ap-south-1, static website hosting, error doc = `index.html`) |
| CloudFront | `E39BG4XMB7DKLB` |
| Site | https://www.magizhmatrimony.com |
| Build output | `dist/` (repo root) |
| Build command | `pnpm build` (runs `tsc --noEmit && vite build`) |

> Only deploy New-FE **or** the existing `matrimony-frontend` magizh pipeline to
> this bucket — the second deploy overwrites the first (`aws s3 sync --delete`).

## SPA routing on S3 (already handled)

The `magizhmatrimony` bucket has **Error document = `index.html`**, and
CloudFront's origin is the S3 **website endpoint**
(`magizhmatrimony.s3-website.ap-south-1.amazonaws.com`). So a refresh or deep
link like `/search` or `/profile/SM12` serves `index.html`, React boots, and
`BrowserRouter` renders the route. No extra 404 config needed as long as this
bucket is reused with those settings unchanged.

Repo: `https://github.com/saranwork2026/front_end_v0.git` (branch `main`).

## shared-core is vendored — single-repo build

`@matrimony/shared-core` (API clients, types, zod schemas, zustand stores) is
**vendored into this repo** at `packages/shared-core/`. It is resolved directly
from its TypeScript source via aliases, so there is **no separate build step**
and **no dependency on the `matrimony-frontend` repo**:

- `package.json`: `"@matrimony/shared-core": "file:./packages/shared-core"`
- `vite.config.ts`: alias `@matrimony/shared-core` → `packages/shared-core/src/index.ts`
- `tsconfig.json`: `paths` maps `@matrimony/shared-core` → the same source, and
  `include` covers `packages/shared-core/src` (test files excluded).

To change shared logic (an API call, a type, a schema), edit files under
`packages/shared-core/src/` — changes are live in dev and picked up by the
build with no rebuild of a separate package.

## Prerequisites before the Jenkins pipeline can run

1. **Reuse existing Jenkins credentials** (same IDs as the magizh pipeline):
   - `github-pat` — GitHub checkout
   - `aws-credentials` — S3 sync + CloudFront invalidation
2. **Node/pnpm + AWS CLI** available on the Jenkins agent (already true for the
   existing frontend pipeline on the shared Lightsail instance).
3. Create a Jenkins Pipeline job pointing at front_end_v0's `Jenkinsfile`.

## Pipeline stages (see `Jenkinsfile`)

1. Checkout front_end_v0 (this repo only — no sibling checkout)
2. `pnpm install --frozen-lockfile`
3. `pnpm build` (`tsc --noEmit && vite build`, typecheck-gated; the vendored
   shared-core src is typechecked + bundled here)
4. `aws s3 sync dist/ s3://magizhmatrimony/ --delete`
5. CloudFront invalidation (`E39BG4XMB7DKLB`, `/*`)

## Manual deploy (single repo)

```powershell
# from New-FE
pnpm install
pnpm build
aws s3 sync dist/ s3://magizhmatrimony/ --region ap-south-1 --delete --profile admin
aws cloudfront create-invalidation --distribution-id E39BG4XMB7DKLB --paths "/*" --profile admin
```

## Before real launch (non-blocking)

- Replace the reCAPTCHA site key in `.env.production` (currently Google's public
  **test** key) with the real key registered for the production domain.
- Consider code-splitting: the app builds as a single ~920 KB JS chunk.
