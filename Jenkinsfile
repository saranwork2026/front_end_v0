// New-FE (standalone Vite SPA) deployment pipeline.
//
// Deploys to the SAME bucket/distribution as the current magizhmatrimony
// frontend (magizhmatrimony / E39BG4XMB7DKLB). Only run this pipeline OR the
// existing matrimony-frontend magizh pipeline against that bucket — not both
// for the same site at the same time, since the second deploy overwrites the
// first (aws s3 sync --delete).
//
// WHY THE TWO-REPO CHECKOUT:
// front_end_v0 is a standalone repo that consumes @matrimony/shared-core via a
// filesystem link in package.json:
//     "@matrimony/shared-core": "file:../matrimony-frontend/packages/shared-core"
// shared-core is a PRIVATE package (not published to npm) that lives in the
// matrimony-frontend repo and must be built (tsc -> dist/) before front_end_v0
// can build. So this pipeline lays the two repos out side-by-side exactly like
// a local dev machine:
//     <workspace>/
//       front_end_v0/           <- this repo (checked out into a subdir)
//       matrimony-frontend/     <- sibling, provides shared-core
// The file: path in front_end_v0 (../matrimony-frontend/...) then resolves.

pipeline {
    agent any

    environment {
        S3_BUCKET                  = 'magizhmatrimony'
        CLOUDFRONT_DISTRIBUTION_ID = 'E39BG4XMB7DKLB'
        AWS_REGION                 = 'ap-south-1'

        // front_end_v0 build output is at the repo root (not apps/web/dist).
        BUILD_DIR                  = 'front_end_v0/dist'

        // Repos.
        NEW_FE_REPO                = 'https://github.com/saranwork2026/front_end_v0.git'
        NEW_FE_BRANCH              = 'main'
        FRONTEND_REPO              = 'https://github.com/saranwork2026/matrimony-frontend.git'
        FRONTEND_BRANCH            = 'release-dev'
    }

    stages {

        // Start each build from an empty workspace. The `git` steps below do
        // fetch + `checkout -f`, which resets TRACKED files but does NOT delete
        // files that became untracked between commits. When pnpm-workspace.yaml
        // was removed from the repo, the stale on-disk copy lingered and pnpm
        // kept failing with "packages field missing or empty". A clean slate
        // each run prevents any such leftover from affecting the build.
        stage('Clean workspace') {
            steps {
                deleteDir()
            }
        }

        // Lay out both repos side-by-side so front_end_v0's file: link to
        // ../matrimony-frontend/packages/shared-core resolves.
        stage('Checkout front_end_v0') {
            steps {
                dir('front_end_v0') {
                    git branch: "${NEW_FE_BRANCH}",
                        credentialsId: 'github-pat',
                        url: "${NEW_FE_REPO}"
                }
            }
        }

        stage('Checkout shared-core (matrimony-frontend)') {
            steps {
                dir('matrimony-frontend') {
                    git branch: "${FRONTEND_BRANCH}",
                        credentialsId: 'github-pat',
                        url: "${FRONTEND_REPO}"
                }
            }
        }

        // Build shared-core first: its dist/ (referenced by New-FE via
        // package.json "main": "./dist/index.js") must exist before New-FE's
        // install/build can resolve the module.
        stage('Build shared-core') {
            steps {
                dir('matrimony-frontend') {
                    // bash shebang so `set -o pipefail` works (Jenkins sh is
                    // dash on Ubuntu, which rejects pipefail). Without it a
                    // failing pnpm would be masked by tee's exit 0.
                    sh '''#!/bin/bash
                        set -o pipefail
                        pnpm install --frozen-lockfile 2>&1 | tee ../shared-core-install.log
                        pnpm --filter shared-core build 2>&1 | tee ../shared-core-build.log
                    '''
                }
            }
            post {
                failure {
                    echo '===== SHARED-CORE FAILURE LOG ====='
                    sh 'tail -80 shared-core-install.log shared-core-build.log 2>/dev/null || true'
                    echo '===== END LOG ====='
                }
            }
        }

        stage('Install front_end_v0') {
            steps {
                dir('front_end_v0') {
                    // --config.dangerouslyAllowAllBuilds=true permits dependency
                    // postinstall build scripts (here just esbuild@0.21.5, vite's
                    // bundler — pinned and already trusted in the existing
                    // frontend). Without it pnpm blocks the script and fails with
                    // ERR_PNPM_IGNORED_BUILDS. This flag is honored across pnpm 9
                    // (CI) and 11 (local), unlike the per-version config files.
                    sh '''#!/bin/bash
                        set -o pipefail
                        pnpm install --frozen-lockfile --config.dangerouslyAllowAllBuilds=true 2>&1 | tee ../front_end_v0-install.log
                    '''
                }
            }
            post {
                failure {
                    echo '===== FRONT_END_V0 INSTALL FAILURE LOG ====='
                    sh 'tail -80 front_end_v0-install.log 2>/dev/null || true'
                    echo '===== END LOG ====='
                }
            }
        }

        // `pnpm build` runs `tsc --noEmit && vite build`, so a type error
        // fails the pipeline here rather than shipping silently.
        stage('Build front_end_v0') {
            steps {
                dir('front_end_v0') {
                    sh '''#!/bin/bash
                        set -o pipefail
                        pnpm build 2>&1 | tee ../front_end_v0-build.log
                    '''
                }
            }
            post {
                failure {
                    echo '===== FRONT_END_V0 BUILD FAILURE LOG ====='
                    sh 'tail -120 front_end_v0-build.log 2>/dev/null || true'
                    echo '===== END LOG ====='
                }
            }
        }

        stage('Deploy to S3') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding',
                                  credentialsId: 'aws-credentials',
                                  accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                                  secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                    sh """
                        echo "Syncing ${BUILD_DIR}/ to s3://${S3_BUCKET}/ ..."
                        aws s3 sync ${BUILD_DIR}/ s3://${S3_BUCKET}/ --region ${AWS_REGION} --delete
                        echo "S3 sync complete."
                    """
                }
            }
            post {
                failure {
                    echo '===== S3 DEPLOY FAILURE ====='
                    echo 'Check AWS credentials in Jenkins Credentials Store (id: aws-credentials).'
                    echo '===== END LOG ====='
                }
            }
        }

        stage('Invalidate CloudFront') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding',
                                  credentialsId: 'aws-credentials',
                                  accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                                  secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                    script {
                        def output = sh(
                            script: "aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} --paths '/*'",
                            returnStdout: true
                        ).trim()
                        echo "CloudFront invalidation response:\n${output}"
                        echo "CloudFront cache invalidation initiated."
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'front_end_v0 build and deployment successful.'
            echo 'Site: https://www.magizhmatrimony.com'
        }
        failure {
            echo 'front_end_v0 build or deployment failed.'
        }
    }
}
