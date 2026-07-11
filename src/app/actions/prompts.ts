'use server'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function savePromptTemplate(data: {
  id?: string
  name: string
  outputType: string
  tier: string
  promptText: string
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const { id, name, outputType, tier, promptText } = data

  if (id) {
    await db.promptTemplate.update({
      where: { id },
      data: {
        name,
        outputType,
        tier,
        promptText,
        updatedBy: session.user.name ?? session.user.email,
      },
    })
  } else {
    // Check if unique constraint would be violated
    const existing = await db.promptTemplate.findUnique({
      where: {
        outputType_tier: {
          outputType,
          tier,
        },
      },
    })
    if (existing) {
      throw new Error(`A prompt template for ${outputType} and tier ${tier} already exists.`)
    }

    await db.promptTemplate.create({
      data: {
        name,
        outputType,
        tier,
        promptText,
        updatedBy: session.user.name ?? session.user.email,
      },
    })
  }

  revalidatePath('/admin/prompts')
}

export async function deletePromptTemplate(id: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  await db.promptTemplate.delete({
    where: { id },
  })

  revalidatePath('/admin/prompts')
}
