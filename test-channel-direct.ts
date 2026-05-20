import { createChannel } from '../src/lib/notifications/channels'

async function testDirectChannel() {
  console.log('=== PASO 2: TEST V2 DIRECTO (Provider aislado) ===\n')

  const channel = createChannel('whatsapp', { provider: 'mock' })
  if (!channel) {
    console.log('✗ createChannel returned null')
    return
  }

  console.log('Provider:', channel.getProviderName())
  console.log('Channel:', channel.getChannel())
  console.log('')

  const result = await channel.send({
    channel: 'whatsapp',
    toAddress: '573124859493',
    body: '¡Hola Pedro! Te recordamos tu cita mañana a las 3:00 PM en Candela.',
    subject: 'Recordatorio de cita',
    templateId: '',
    appointmentId: 'ed9a5c8f-d869-4fd0-98f8-06031d136481',
    organizationId: '94019707-e3c0-4bdc-9aac-58d2f06cddd2',
    idempotencyKey: 'test_mock_' + Date.now(),
    variables: {
      clientName: 'Pedro Martinez',
      appointmentDate: '21 de mayo de 2026',
      appointmentTime: '3:00 PM',
      businessName: 'Candela',
    },
    metadata: {
      traceId: 'test_' + Date.now(),
      test: true,
    },
  })

  console.log('Result:', JSON.stringify(result, null, 2))
  console.log('')
  console.log('✓ Test direct channel completado')
  console.log(`  Success: ${result.success}`)
  console.log(`  Mock: ${result.mock}`)
  console.log(`  ProviderMessageId: ${result.providerMessageId}`)
  if (result.mockPayload) {
    console.log(`  Payload endpoint: ${(result.mockPayload as any).endpoint}`)
    console.log(`  Payload to: ${(result.mockPayload as any).to}`)
  }
}

testDirectChannel().catch(console.error)
