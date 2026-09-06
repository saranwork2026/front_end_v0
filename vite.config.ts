import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_BASE_URL?.replace(/\/api\/v1\/?$/, '') || 'https://api.magizhmatrimony.com'

  return {
    plugins: [react()],
    // sockjs-client (used by the chat STOMP socket) references a Node-style
    // `global`, which does not exist in the browser under Vite. Map it to
    // globalThis so importing the chat socket doesn't throw at load time.
    define: {
      global: 'globalThis',
    },
    resolve: {
      alias: [
        { find: 'next/link', replacement: path.resolve(__dirname, 'src/compat/next-link.tsx') },
        { find: 'next/navigation', replacement: path.resolve(__dirname, 'src/compat/next-navigation.ts') },
        { find: 'next/image', replacement: path.resolve(__dirname, 'src/compat/next-image.tsx') },
        { find: '@', replacement: path.resolve(__dirname, '.') },
      ],
    },
    server: {
      host: true,
      port: 3000,
      allowedHosts: true,
      // Dev-only proxy so the browser talks to a same-origin path and Vite
      // forwards to the production API. The production backend's CORS allow-list
      // only permits the real site origins, so it rejects a raw
      // `Origin: http://localhost:3000` with 403 "Invalid CORS request". We
      // therefore rewrite the outgoing Origin/Referer to an allowed origin so
      // dev requests are accepted. NOTE: HttpOnly auth cookies scoped to
      // *.magizhmatrimony.com are still not stored for localhost — see README /
      // STEP 4 notes for the cookie-domain limitation.
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
          // Rewrite the auth cookie Domain (…magizhmatrimony.com) to the dev
          // host so the browser actually stores it over http://localhost.
          cookieDomainRewrite: '',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('origin', 'https://www.magizhmatrimony.com')
              proxyReq.setHeader('referer', 'https://www.magizhmatrimony.com/')
            })
            // Strip Secure / SameSite=None from Set-Cookie so the cookie is
            // accepted on the insecure localhost origin during dev.
            proxy.on('proxyRes', (proxyRes) => {
              const sc = proxyRes.headers['set-cookie']
              if (Array.isArray(sc)) {
                proxyRes.headers['set-cookie'] = sc.map((c) =>
                  c
                    .replace(/;\s*Secure/gi, '')
                    .replace(/;\s*SameSite=None/gi, '; SameSite=Lax'),
                )
              }
            })
          },
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  }
})
