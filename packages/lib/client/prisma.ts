import { PrismaClient } from '../generated/prisma'

console.log('PrismaClient initialized')
export const prisma = new PrismaClient()
