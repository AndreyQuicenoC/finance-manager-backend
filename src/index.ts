/**
 * @fileoverview Application entry point and server initialization.
 * @module index
 * @requires dotenv
 * @requires ./app
 * 
 * @description
 * Entry point for the Finance Manager Backend application.
 * - Loads environment variables (development only)
 * - Validates required environment variables
 * - Starts Express server on configured port
 */

// Load environment variables only in development
// In production, variables should be set in the hosting platform (Render, Heroku, etc.)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

import app from './app';

/**
 * List of required environment variables.
 * 
 * @constant {string[]} requiredEnvVars
 */
const requiredEnvVars = ['JWT_SECRET'];

/**
 * Validate that all required environment variables are set.
 * Exits process if any are missing.
 */
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Error: Missing required environment variables:');
  missingVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error('\n💡 Tip: Create a .env file or set these variables in your hosting platform.');
  process.exit(1);
}

/**
 * Server port from environment or default.
 * 
 * @constant {number} PORT
 * @default 3000
 */
const PORT = process.env.PORT || 3000;

/**
 * Current environment.
 * 
 * @constant {string} NODE_ENV
 * @default 'development'
 */
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Start the Express server.
 * 
 * @description
 * Listens on the configured PORT and logs server information.
 */
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📦 Environment: ${NODE_ENV}`);
});
