// New-FE (standalone Vite SPA) deployment pipeline.
//
// Deploys to the SAME bucket/distribution as the current magizhmatrimony
// frontend (magizhmatrimony / E39BG4XMB7DKLB). Only run this pipeline OR the
// existing matrimony-frontend magizh pipeline against that bucket — not both
// for the same site at the same time, since the second deploy overwrites the
// first (aws s3 sync --delete).
//
// SINGLE-REPO BUILD:
// front_end_v0 is fully self-contained. @matrimony/shared-core is VENDORED into
// this repo at packages/shared-core and resolved from its TypeScript source via
// Vite + tsconfig aliases (see vite.config.ts / tsconfig.json), so there is no
// separate build step and no dependency on the matrimony-frontend repo. The
// pipeline therefore checks out ONLY this repo.

pipeline {
    agent any

    environment {
        S3_BUCKET                  = 'magizhmatrimony'
        CLOUDFRONT_DISTRIBUTION_ID = 'E39BG4XMB7DKLB'
        AWS_REGION                 = 'ap-south-1'

        // front_end_v0 build output is at the repo root (not apps/web/dist).
        BUILD_DIR                  = 'dist'

        NEW_FE_REPO                = 'https://github.com/saranwork2026/front_end_v0.git'
        NEW_FE_BRANCH              = 'main'
    }

    stages {

        // Start each build from an empty workspace. `checkout -f` resets TRACKED
        // files but does NOT delete files that became untracked between commits;
        // a clean slate each run prevents any such leftover from affecting the
        // build.
        stage('Clean workspace') {
            steps {
                deleteDir()
            }
        }

        stage('Checkout') {
            steps {
                git branch: "${NEW_FE_BRANCH}",
                    credentialsId: 'github-pat',
                    url: "${NEW_FE_REPO}"
            }
        }

        stage('Install') {
            steps {
                // --config.dangerouslyAllowAllBuilds=true permits dependency
                // postinstall build scripts (here just esbuild, vite's bundler —
                // pinned and trusted). Without it pnpm blocks the script and
                // fails with ERR_PNPM_IGNORED_BUILDS. Honored across pnpm 9 (CI)
                // and 11 (local).
                sh '''#!/bin/bash
                    set -o pipefail
                    # Safety net: this is a single-package app, not a pnpm
                    # monorepo. A stray pnpm-workspace.yaml forces workspace mode
                    # and fails install with "packages field missing or empty".
                    rm -f pnpm-workspace.yaml
                    pnpm install --frozen-lockfile --config.dangerouslyAllowAllBuilds=true 2>&1 | tee install.log
                '''
            }
            post {
                failure {
                    echo '===== INSTALL FAILURE LOG ====='
                    sh 'tail -80 install.log 2>/dev/null || true'
                    echo '===== END LOG ====='
                }
            }
        }

        // `pnpm build` runs `tsc --noEmit && vite build`, so a type error fails
        // the pipeline here rather than shipping silently. The vendored
        // shared-core src is typechecked + bundled as part of this build.
        stage('Build') {
            steps {
                sh '''#!/bin/bash
                    set -o pipefail
                    pnpm build 2>&1 | tee build.log
                '''
            }
            post {
                failure {
                    echo '===== BUILD FAILURE LOG ====='
                    sh 'tail -120 build.log 2>/dev/null || true'
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
