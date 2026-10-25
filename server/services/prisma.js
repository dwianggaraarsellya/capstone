import '../loadEnv.js';
import net from 'net';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
  process.env.DATABASE_URL = process.env.DIRECT_URL || 'postgresql://postgres:postgres@localhost:5432/tanico?schema=public';
}
if (!process.env.DIRECT_URL || process.env.DIRECT_URL.trim() === '') {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

const globalForPrisma = globalThis;

let isDbReachable = null;
let lastCheckTime = 0;
const RECHECK_INTERVAL_MS = 30000;

function parseDbTarget(urlStr) {
  try {
    const parsed = new URL(urlStr);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port, 10) || 5432,
    };
  } catch {
    return { host: 'localhost', port: 5432 };
  }
}

function probeDatabaseReachable(host, port, timeoutMs = 400) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let finished = false;

    const done = (val) => {
      if (!finished) {
        finished = true;
        socket.destroy();
        resolve(val);
      }
    };

    socket.setTimeout(timeoutMs);
    socket.on('connect', () => done(true));
    socket.on('timeout', () => done(false));
    socket.on('error', () => done(false));

    try {
      socket.connect(port, host);
    } catch {
      done(false);
    }
  });
}

async function checkDatabaseOnline() {
  const now = Date.now();
  if (isDbReachable !== null && now - lastCheckTime < RECHECK_INTERVAL_MS) {
    return isDbReachable;
  }
  const { host, port } = parseDbTarget(process.env.DATABASE_URL);
  isDbReachable = await probeDatabaseReachable(host, port, 400);
  lastCheckTime = now;
  if (!isDbReachable) {
    logDbNoticeOnce();
  }
  return isDbReachable;
}

// Initial probe in background
checkDatabaseOnline().catch(() => {});

function getPrismaClient() {
  if (!globalForPrisma.__expressPrisma) {
    try {
      const client = new PrismaClient({
        log: [
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ],
      });
      client.$on('error', (e) => {
        logDbNoticeOnce(e);
      });
      client.$on('warn', () => {});
      globalForPrisma.__expressPrisma = client;
    } catch (err) {
      console.warn('[Prisma] Initialization notice:', err?.message || err);
    }
  }
  return globalForPrisma.__expressPrisma;
}

let dbOfflineLogged = false;
function logDbNoticeOnce(err) {
  if (!dbOfflineLogged) {
    dbOfflineLogged = true;
    console.warn('[Prisma] Notice: Database is currently offline or unreachable. Returning safe fallback responses.');
  }
}

function createModelDelegateProxy(delegate, modelName) {
  return new Proxy(delegate || {}, {
    get(target, method) {
      const orig = target[method];
      if (typeof orig === 'function') {
        return async function (...args) {
          // If we already know DB is unreachable, return safe fallback immediately
          if (isDbReachable === false && Date.now() - lastCheckTime < RECHECK_INTERVAL_MS) {
            if (method === 'findMany') return [];
            if (method === 'findFirst' || method === 'findUnique') return null;
            if (method === 'count') return 0;
            if (method === 'aggregate') return { _count: 0, _sum: {}, _avg: {}, _min: {}, _max: {} };
            if (method === 'create' || method === 'update' || method === 'upsert' || method === 'delete') {
              throw new Error(`Operasi ${modelName}.${String(method)} gagal: Database PostgreSQL sedang tidak terhubung.`);
            }
          }

          try {
            const res = await orig.apply(target, args);
            isDbReachable = true;
            return res;
          } catch (err) {
            const errName = err?.name || '';
            const errMsg = err?.message || '';
            const isConnectionError =
              errName === 'PrismaClientInitializationError' ||
              errName === 'PrismaClientRustPanicError' ||
              errMsg.includes("Can't reach database server") ||
              errMsg.includes('database server is not running') ||
              errMsg.includes('P1001') ||
              errMsg.includes('P1002') ||
              errMsg.includes('P1003');

            if (isConnectionError) {
              isDbReachable = false;
              lastCheckTime = Date.now();
              logDbNoticeOnce(err);
              if (method === 'findMany') return [];
              if (method === 'findFirst' || method === 'findUnique') return null;
              if (method === 'count') return 0;
              if (method === 'aggregate') return { _count: 0, _sum: {}, _avg: {}, _min: {}, _max: {} };
              if (method === 'create' || method === 'update' || method === 'upsert' || method === 'delete') {
                throw new Error(`Operasi ${modelName}.${String(method)} gagal: Database PostgreSQL sedang tidak terhubung.`);
              }
            }
            throw err;
          }
        };
      }
      return orig;
    }
  });
}

// Proxy that ensures Prisma is lazily initialized on demand and delegates are safely wrapped
export const prisma = new Proxy({}, {
  get(target, prop) {
    const client = getPrismaClient();
    if (!client) {
      console.warn(`[Prisma] Client not available when accessing '${String(prop)}', using safe fallback`);
      return {
        findMany: async () => [],
        findFirst: async () => null,
        findUnique: async () => null,
        count: async () => 0,
        create: async () => ({}),
        update: async () => ({}),
        delete: async () => ({}),
        upsert: async () => ({}),
      };
    }

    if (prop === '$transaction') {
      return async function (arg) {
        if (isDbReachable === false && Date.now() - lastCheckTime < RECHECK_INTERVAL_MS) {
          throw new Error('Database PostgreSQL sedang tidak terhubung.');
        }
        try {
          return await client.$transaction(arg);
        } catch (err) {
          if (err?.message?.includes("Can't reach database server") || err?.name === 'PrismaClientInitializationError') {
            isDbReachable = false;
            lastCheckTime = Date.now();
            throw new Error('Database PostgreSQL sedang tidak terhubung.');
          }
          throw err;
        }
      };
    }

    const val = client[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    if (val && typeof val === 'object') {
      return createModelDelegateProxy(val, String(prop));
    }
    if (val === undefined) {
      return {
        findMany: async () => [],
        findFirst: async () => null,
        findUnique: async () => null,
        count: async () => 0,
        create: async () => ({}),
        update: async () => ({}),
        delete: async () => ({}),
        upsert: async () => ({}),
      };
    }
    return val;
  }
});

export default prisma;

