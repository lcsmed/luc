import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function setupAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@itmol.com'
  const password = process.env.ADMIN_PASSWORD || 'changeMe123!'
  const name = process.env.ADMIN_NAME || 'Admin'

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log('Admin user already exists')
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    })

    console.log('Admin user created successfully!')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
    console.log('Please change the password after first login!')
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupAdmin()