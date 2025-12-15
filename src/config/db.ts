/**
 * @fileoverview Prisma database client configuration and singleton instance.
 * @module config/db
 * @requires @prisma/client
 * 
 * @description
 * Creates and exports a singleton Prisma Client instance for database operations.
 * This ensures only one database connection pool is created throughout the application.
 * 
 * @example
 * // Usage in controllers:
 * import prisma from '../config/db';
 * 
 * const users = await prisma.user.findMany();
 * 
 * @see {@link https://www.prisma.io/docs/concepts/components/prisma-client Prisma Client Documentation}
 */

import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma Client instance.
 * 
 * @constant {PrismaClient} prisma
 * @description
 * Single instance of Prisma Client used throughout the application.
 * Automatically handles connection pooling and query optimization.
 */
const prisma = new PrismaClient();

export default prisma;
