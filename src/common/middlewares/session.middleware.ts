import * as session from 'express-session';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';
import * as pgSession from 'connect-pg-simple';
import { Pool } from 'pg';

let sessionStore: any = null;

// Database config interface
interface DbConfig {
  username?: string;
  password?: string;
  host?: string;
  port?: string | number;
  name?: string;
}

export function createSessionMiddleware(secret: string, dbConfig?: DbConfig | null) {
  // If the store hasn't been initialized yet, create it
  if (!sessionStore) {
    const PgStore = pgSession(session);
    
    // Create a PostgreSQL connection pool using environment variables or config
    const pgPool = new Pool({
      user: dbConfig?.username || process.env.DATABASE_USERNAME,
      password: dbConfig?.password || process.env.DATABASE_PASSWORD,
      host: dbConfig?.host || process.env.DATABASE_HOST || 'postgres', // Use service name from docker-compose
      port: parseInt(String(dbConfig?.port || process.env.DATABASE_PORT || '5432')),
      database: dbConfig?.name || process.env.DATABASE_NAME,
      // Add connection options for Docker environment
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    
    // Log connection info (exclude password)
    console.log('Session store connecting to PostgreSQL:', {
      user: dbConfig?.username || process.env.DATABASE_USERNAME,
      host: dbConfig?.host || process.env.DATABASE_HOST || 'postgres',
      port: parseInt(String(dbConfig?.port || process.env.DATABASE_PORT || '5432')),
      database: dbConfig?.name || process.env.DATABASE_NAME,
    });
    
    // Create session store instance
    sessionStore = new PgStore({
      pool: pgPool,
      tableName: 'user_sessions', // Table to store sessions
      createTableIfMissing: true, // Auto-create the table
    });
    
    // Log on successful connection
    pgPool.on('connect', () => {
      console.log('Session store connected to PostgreSQL successfully');
    });
    
    // Log any errors
    pgPool.on('error', (err) => {
      console.error('Session store PostgreSQL connection error:', err);
    });
  }

  return session({
    store: sessionStore, // Use PostgreSQL session store
    secret,
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid',
    cookie: {
      sameSite: 'lax',
      secure: false, // true in production with HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  });
}

export const passportMiddlewares = [
  passport.initialize(),
  passport.session(),
];

// Middleware for debugging session correlation
export const sessionDebugMiddleware = (req: any, res: any, next: any) => {
  if (req.session) {
    console.log('Session middleware applied - ID:', req.sessionID);
    console.log('Session passport data:', req.session.passport || 'none');
    console.log('Is authenticated:', req.isAuthenticated ? req.isAuthenticated() : 'method not available');
  } else {
    console.log('Session middleware applied but no session object');
  }
  next();
};

export const cookieParserMiddleware = cookieParser();