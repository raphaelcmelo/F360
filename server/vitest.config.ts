import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // Use Vitest global APIs
    environment: 'node', // Specify Node.js environment
    setupFiles: [], // Optional: for setup files
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
    },
    // To allow Vitest to work with TypeScript paths if you use them (e.g. in tsconfig.json)
    // alias: { 
    //   '@/*': './src/*' 
    // },
  },
});
