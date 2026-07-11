import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, companyName } = await req.json()

    if (!name || !email || !password || !companyName) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'CLIENT',
        clientProfile: {
          create: {
            companyName,
            region: 'FR',
            complianceType: 'CSE',
          },
        },
      },
    })

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 })
  } catch (err) {
    console.error('[SIGNUP ERROR]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
