'use server'

import { z } from 'zod'

const TestWebhookSchema = z.object({
  webhookUrl: z.string().url(),
  apiKey: z.string().optional(),
})

export async function testWhatsAppWebhook(
  input: z.infer<typeof TestWebhookSchema>
): Promise<{
  success: boolean
  error?: string
}> {
  const validation = TestWebhookSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: 'URL de webhook inválida' }
  }

  const { webhookUrl, apiKey } = validation.data

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        test: true,
        message: 'Prueba de conexión desde Prügressy',
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok || response.status === 200 || response.status === 201) {
      return { success: true }
    }

    return { 
      success: false, 
      error: `El webhook respondió con código ${response.status}` 
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Tiempo de espera agotado' }
    }
    console.error('Error testing webhook:', error)
    return { success: false, error: 'No se pudo conectar al webhook' }
  }
}
