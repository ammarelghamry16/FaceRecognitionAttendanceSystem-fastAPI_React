/**
 * Comprehensive Status Checker for AttendanceAI
 * Checks: Frontend, Backend API, PostgreSQL Database, Redis Cache
 */
const http = require('http');
const https = require('https'); // Added HTTPS support
const net = require('net');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI Colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
};

// Load environment variables from FastAPI/.env
function loadEnv() {
    const envPath = path.join(__dirname, '..', 'FastAPI', '.env');
    const config = {
        DATABASE_URL: '',
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
    };

    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            if (line.startsWith('#') || !line.includes('=')) return;
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=').replace(/^["']|["']$/g, '').trim();
            if (key.trim() === 'DATABASE_URL') config.DATABASE_URL = value;
            if (key.trim() === 'REDIS_HOST') config.REDIS_HOST = value;
            if (key.trim() === 'REDIS_PORT') config.REDIS_PORT = parseInt(value) || 6379;
        });
    } catch (e) {
        // .env not found
    }
    return config;
}

const config = loadEnv();

// Parse database URL
function parseDatabaseUrl(url) {
    try {
        const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
        if (match) {
            return {
                user: match[1],
                password: match[2],
                host: match[3],
                port: parseInt(match[4]),
                database: match[5],
            };
        }
    } catch (e) { }
    return null;
}

const dbConfig = parseDatabaseUrl(config.DATABASE_URL);

// Service definitions
const services = [
    {
        name: 'Frontend (Local)',
        type: 'http',
        url: 'http://localhost:3000',
        port: 3000,
        required: false, // Not required if using cloud
    },
    {
        name: 'Backend API (Local)',
        type: 'http',
        url: 'http://localhost:8000/docs',
        port: 8000,
        required: false,
    },
    {
        name: 'Backend API (Cloud)',
        type: 'https', // Changed to HTTPS check
        url: 'https://legendpanda-face-detection-attendance-system.hf.space/docs',
        port: 443,
        required: true, // This is your main production backend now
    },
    {
        name: 'PostgreSQL Database',
        type: 'tcp',
        host: dbConfig?.host || 'localhost',
        port: dbConfig?.port || 5432,
        required: true,
        info: dbConfig ? `${dbConfig.host}:${dbConfig.port}` : 'Not configured',
    },
    {
        name: 'Redis Cache',
        type: 'tcp',
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        required: false,
        info: `${config.REDIS_HOST}:${config.REDIS_PORT}`,
    },
];

// Check HTTP/HTTPS service
function checkHttp(service) {
    const protocol = service.type === 'https' ? https : http;
    return new Promise((resolve) => {
        const req = protocol.get(service.url, { timeout: 5000 }, (res) => {
            resolve({ ...service, status: 'running', statusCode: res.statusCode });
        });
        req.on('error', () => {
            resolve({ ...service, status: 'stopped' });
        });
        req.on('timeout', () => {
            req.destroy();
            resolve({ ...service, status: 'stopped' });
        });
    });
}

// Check TCP port
function checkTcp(service) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(3000);

        socket.on('connect', () => {
            socket.destroy();
            resolve({ ...service, status: 'running' });
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve({ ...service, status: 'stopped' });
        });

        socket.on('error', () => {
            socket.destroy();
            resolve({ ...service, status: 'stopped' });
        });

        socket.connect(service.port, service.host);
    });
}

// Check Python venv
function checkPythonVenv() {
    const venvPath = path.join(__dirname, '..', 'FastAPI', 'venv');
    return fs.existsSync(venvPath);
}

// Check Node modules
function checkNodeModules() {
    const nmPath = path.join(__dirname, '..', 'frontend', 'my-app', 'node_modules');
    return fs.existsSync(nmPath);
}

// Print header
function printHeader(text) {
    console.log('');
    console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}  ${text}${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);
}

// Print status line
function printStatus(name, status, info = '') {
    const isRunning = status === 'running';
    const icon = isRunning ? `${colors.green}[OK]` : `${colors.red}[--]`;
    const statusText = isRunning ? `${colors.green}Running` : `${colors.red}Not Running`;
    const infoText = info ? `${colors.dim} (${info})${colors.reset}` : '';

    console.log(`  ${icon}${colors.reset} ${name.padEnd(25)} ${statusText}${colors.reset}${infoText}`);
}

// Print setup status
function printSetup(name, installed, info = '') {
    const icon = installed ? `${colors.green}[OK]` : `${colors.yellow}[!!]`;
    const statusText = installed ? `${colors.green}Installed` : `${colors.yellow}Not Installed`;
    const infoText = info ? `${colors.dim} (${info})${colors.reset}` : '';

    console.log(`  ${icon}${colors.reset} ${name.padEnd(25)} ${statusText}${colors.reset}${infoText}`);
}

// Main function
async function main() {
    console.log('');
    console.log(`${colors.cyan}${colors.bold}`);
    console.log('    _   _   _                     _                      _    ___ ');
    console.log('   / \\ | |_| |_ ___ _ __   __| | __ _ _ __   ___ ___/ \\  |_ _|');
    console.log('  / _ \\| __| __/ _ \\ \'_ \\ / _` |/ _` | \'_ \\ / __/ _ / _ \\  | | ');
    console.log(' / ___ \\ |_| ||  __/ | | | (_| | (_| | | | | (_|  __/ ___ \\ | | ');
    console.log('/_/   \\_\\__|\\__\\___|_| |_|\\__,_|\\__,_|_| |_|\\___\\___/_/   \\_\\___|');
    console.log(`${colors.reset}`);
    console.log(`${colors.dim}                    System Status Dashboard${colors.reset}`);

    // Check services
    printHeader('SERVICES STATUS');

    const results = await Promise.all(
        services.map(service => {
            if (service.type === 'http' || service.type === 'https') return checkHttp(service);
            if (service.type === 'tcp') return checkTcp(service);
            return Promise.resolve({ ...service, status: 'unknown' });
        })
    );

    let allRequired = true;
    results.forEach(result => {
        printStatus(result.name, result.status, result.info);
        if (result.required && result.status !== 'running') {
            allRequired = false;
        }
    });

    // Check setup
    printHeader('SETUP STATUS');

    const pythonVenv = checkPythonVenv();
    const nodeModules = checkNodeModules();

    printSetup('Python Virtual Env', pythonVenv, 'FastAPI/venv');
    printSetup('Node Modules', nodeModules, 'frontend/my-app/node_modules');
    printSetup('Database Config', !!dbConfig, dbConfig ? 'Supabase Cloud' : 'Not found');
    printSetup('Redis Config', !!config.REDIS_HOST, config.REDIS_HOST !== 'localhost' ? 'Cloud Redis' : 'Localhost (Warning)');

    // URLs
    printHeader('ACCESS URLS');
    console.log(`${colors.bold} [LOCAL DEV]${colors.reset}`);
    console.log(`  ${colors.blue}Frontend:${colors.reset}     http://localhost:3000`);
    console.log(`  ${colors.blue}Backend API:${colors.reset}  http://localhost:8000`);
    console.log('');
    console.log(`${colors.bold} [CLOUD DEPLOYMENT]${colors.reset}`);
    console.log(`  ${colors.blue}Frontend:${colors.reset}     https://attendance-frontend.vercel.app`);
    console.log(`  ${colors.blue}Backend API:${colors.reset}  https://legendpanda-face-detection-attendance-system.hf.space`);
    console.log(`  ${colors.blue}API Docs:${colors.reset}     https://legendpanda-face-detection-attendance-system.hf.space/docs`);
    console.log(`  ${colors.blue}WebSocket:${colors.reset}    wss://legendpanda-face-detection-attendance-system.hf.space/api/notifications/ws/{user_id}`);

    // Test accounts
    printHeader('TEST ACCOUNTS');
    console.log(`  ${colors.yellow}Student:${colors.reset}  student@test.com`);
    console.log(`  ${colors.yellow}Mentor:${colors.reset}   mentor@test.com`);
    console.log(`  ${colors.yellow}Admin:${colors.reset}    admin@test.com`);
    console.log(`  ${colors.dim}Password: any password (demo mode)${colors.reset}`);

    // Summary
    printHeader('SUMMARY');

    const runningCount = results.filter(r => r.status === 'running').length;
    const totalCount = results.length;

    if (allRequired) {
        console.log(`  ${colors.green}${colors.bold}✓ All required services are running!${colors.reset}`);
        console.log(`  ${colors.dim}${runningCount}/${totalCount} services online${colors.reset}`);
    } else {
        console.log(`  ${colors.red}${colors.bold}✗ Some required services are not running${colors.reset}`);
        console.log(`  ${colors.dim}${runningCount}/${totalCount} services online${colors.reset}`);
        console.log('');
        console.log(`  ${colors.yellow}To start local services, run:${colors.reset}`);
        console.log(`  ${colors.cyan}npm run dev${colors.reset}`);
    }

    console.log('');
}

main().catch(console.error);