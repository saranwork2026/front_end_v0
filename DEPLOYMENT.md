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

## shared-core dependency (why CI checks out two repos)

front_end_v0 consumes `@matrimony/shared-core` via a filesystem link in
`package.json`:

```
"@matrimony/shared-core": "file:../matrimony-frontend/packages/shared-core"
```

shared-core is a **private** package (not published to npm). It lives in the
`matrimony-frontend` repo and must be built (`tsc` -> `dist/`) before
front_end_v0 can build. Any build environment must lay the two repos out
side-by-side:

```
<workspace>/
  front_end_v0/           <- this repo
  matrimony-frontend/     <- sibling; provides shared-core
```

## Prerequisites before the Jenkins pipeline can run

1. **Reuse existing Jenkins credentials** (same IDs as the magizh pipeline):
   - `github-pat` — GitHub checkout
   - `aws-credentials` — S3 sync + CloudFront invalidation
2. **Node/pnpm + AWS CLI** available on the Jenkins agent (already true for the
   existing frontend pipeline on the shared Lightsail instance).
3. Create a new Jenkins Pipeline job pointing at front_end_v0's `Jenkinsfile`.

## Pipeline stages (see `Jenkinsfile`)

1. Checkout front_end_v0 into `front_end_v0/`
2. Checkout `matrimony-frontend` into `matrimony-frontend/` (sibling)
3. Build shared-core (`pnpm --filter shared-core build`)
4. `pnpm install` + `pnpm build` in front_end_v0 (typecheck-gated)
5. `aws s3 sync dist/ s3://magizhmatrimony/ --delete`
6. CloudFront invalidation (`E39BG4XMB7DKLB`, `/*`)

## Manual deploy (works today, from a machine with both repos side-by-side)

```powershell
# from matrimony-frontend: ensure shared-core is built
pnpm --filter shared-core build

# from New-FE
pnpm build
aws s3 sync dist/ s3://magizhmatrimony/ --region ap-south-1 --delete --profile admin
aws cloudfront create-invalidation --distribution-id E39BG4XMB7DKLB --paths "/*" --profile admin
```

## Before real launch (non-blocking)

- Replace the reCAPTCHA site key in `.env.production` (currently Google's public
  **test** key) with the real key registered for the production domain.
- Consider code-splitting: the app builds as a single ~920 KB JS chunk.
