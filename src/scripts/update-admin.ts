import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function updateAdmin() {
  const oldEmail = process.env.OLD_EMAIL || 'admin@itmol.com'
  const newEmail = process.env.NEW_EMAIL || 'lucsam@lucsam.com'
  const newPassword = process.env.NEW_PASSWORD || 'Mindfulness123!'
  
  try {
    // Find the existing admin user
    const existingUser = await prisma.user.findUnique({
      where: { email: oldEmail }
    })
    
    if (!existingUser) {
      console.log(`No user found with email: ${oldEmail}`)
      console.log('Checking for any existing users...')
      
      const allUsers = await prisma.user.findMany()
      if (allUsers.length > 0) {
        console.log('Found existing users:')
        allUsers.forEach(user => {
          console.log(`- ${user.email} (ID: ${user.id})`)
        })
      } else {
        console.log('No users found in database')
      }
      return
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        email: newEmail,
        password: hashedPassword
      }
    })
    
    console.log('Admin user updated successfully!')
    console.log(`New email: ${updatedUser.email}`)
    console.log(`New password: ${newPassword}`)
    console.log('Please use these credentials to login.')
  } catch (error) {
    console.error('Error updating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateAdmin()