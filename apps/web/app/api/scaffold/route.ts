import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { execSync } from 'child_process'

export async function POST(req: NextRequest) {
    try {
        const config = await req.json()
        const projectDir = join(config.projectPath, config.projectName)
        
        // Create project directory
        await mkdir(projectDir, { recursive: true })

        // Initialize frontend with Vite
        console.log('Initializing frontend...')
        execSync(`npm create vite@latest frontend -- --template ${config.frontend}`, {
            cwd: projectDir,
            stdio: 'inherit'
        })

        // Update frontend vite config with custom port
        const viteConfig = `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: ${config.frontendPort},
        proxy: {
            '/api': {
                target: 'http://localhost:${config.backendPort}',
                changeOrigin: true
            }
        }
    }
})`

        await writeFile(
            join(projectDir, 'frontend', 'vite.config.ts'),
            viteConfig.trim()
        )

        // Initialize backend
        console.log('Initializing backend...')
        await mkdir(join(projectDir, 'backend'))
        
        // Create backend package.json
        const backendPackageJson = {
            name: "backend",
            version: "1.0.0",
            scripts: {
                "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
                "build": "tsc",
                "start": "node dist/index.js"
            },
            dependencies: {
                "express": "^4.18.2",
                "cors": "^2.8.5",
                "dotenv": "^16.3.1"
            },
            devDependencies: {
                "@types/express": "^4.17.17",
                "@types/cors": "^2.8.13",
                "@types/node": "^20.4.5",
                "typescript": "^5.1.6",
                "ts-node-dev": "^2.0.0"
            }
        }

        await writeFile(
            join(projectDir, 'backend', 'package.json'),
            JSON.stringify(backendPackageJson, null, 2)
        )

        // Create backend tsconfig.json
        const tsConfig = {
            compilerOptions: {
                "target": "ES2020",
                "module": "CommonJS",
                "lib": ["ES2020"],
                "moduleResolution": "node",
                "outDir": "./dist",
                "rootDir": "./src",
                "strict": true,
                "esModuleInterop": true,
                "skipLibCheck": true,
                "forceConsistentCasingInFileNames": true,
                "resolveJsonModule": true
            },
            include: ["src/**/*"],
            exclude: ["node_modules"]
        }

        await writeFile(
            join(projectDir, 'backend', 'tsconfig.json'),
            JSON.stringify(tsConfig, null, 2)
        )

        // Create backend source directory and files
        await mkdir(join(projectDir, 'backend', 'src'))

        // Create backend index.ts
        const backendIndex = `
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || ${config.backendPort};

app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Hello from Express!' });
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(port, () => {
    console.log(\`Server running on port \${port}\`);
});`

        await writeFile(
            join(projectDir, 'backend', 'src', 'index.ts'),
            backendIndex.trim()
        )

        // Create backend .env
        const envFile = `
PORT=${config.backendPort}
NODE_ENV=development
# Add your environment variables here
`

        await writeFile(
            join(projectDir, 'backend', '.env'),
            envFile.trim()
        )

        // Create root package.json for project management
        const rootPackageJson = {
            name: config.projectName,
            version: '1.0.0',
            private: true,
            scripts: {
                "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
                "dev:frontend": "cd frontend && npm run dev",
                "dev:backend": "cd backend && npm run dev",
                "build": "concurrently \"cd frontend && npm run build\" \"cd backend && npm run build\"",
                "install:all": "concurrently \"cd frontend && npm install\" \"cd backend && npm install\"",
                "start": "concurrently \"cd frontend && npm run preview\" \"cd backend && npm start\""
            },
            devDependencies: {
                "concurrently": "^8.2.0"
            }
        }

        await writeFile(
            join(projectDir, 'package.json'),
            JSON.stringify(rootPackageJson, null, 2)
        )

        // Create README.md
        const readme = `
# ${config.projectName}

Full-stack application with React frontend and Express backend.

## Development

1. Install dependencies:
   \`\`\`bash
   npm install
   npm run install:all
   \`\`\`

2. Start development servers:
   \`\`\`bash
   npm run dev
   \`\`\`

   - Frontend: http://localhost:${config.frontendPort}
   - Backend: http://localhost:${config.backendPort}

## Production

1. Build the application:
   \`\`\`bash
   npm run build
   \`\`\`

2. Start production servers:
   \`\`\`bash
   npm start
   \`\`\`

## Project Structure

\`\`\`
${config.projectName}/
├── frontend/          # React frontend (Vite)
├── backend/           # Express backend
│   ├── src/          # TypeScript source files
│   └── dist/         # Compiled JavaScript
└── package.json      # Root package.json for project management
\`\`\`
`

        await writeFile(
            join(projectDir, 'README.md'),
            readme.trim()
        )

        // Create .gitignore
        const gitignore = `
# Dependencies
node_modules
.pnp
.pnp.js

# Production
dist
build

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor
.vscode
.idea
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`

        await writeFile(
            join(projectDir, '.gitignore'),
            gitignore.trim()
        )

        // Install dependencies
        console.log('Installing dependencies...')
        execSync('npm install', { cwd: projectDir, stdio: 'inherit' })
        execSync('npm run install:all', { cwd: projectDir, stdio: 'inherit' })

        return NextResponse.json({
            success: true,
            projectPath: projectDir,
            instructions: {
                setup: [
                    `cd ${projectDir}`,
                    'npm install',
                    'npm run install:all',
                    'npm run dev'
                ]
            }
        })

    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json(
            { 
                error: 'Failed to generate project',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, 
            { status: 500 }
        )
    }
}