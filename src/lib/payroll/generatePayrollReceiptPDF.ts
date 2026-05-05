import { jsPDF } from 'jspdf'

export type PayrollReceiptPDFData = {
  businessName: string
  period: string
  employeeName: string
  netPay: number
  paymentMethod: string
  paymentReference?: string
  paidAt: string
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  nequi: 'Nequi',
  pse: 'PSE',
  banco: 'Transferencia Bancaria',
  daviplata: 'Daviplata',
  cheque: 'Cheque',
}

function formatCurrencyCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

export async function generatePayrollReceiptPDF(data: PayrollReceiptPDFData): Promise<Buffer> {
  const doc = new jsPDF()

  const primaryColor: [number, number, number] = [15, 76, 92]
  const textColor: [number, number, number] = [15, 23, 42]
  const mutedColor: [number, number, number] = [100, 116, 139]

  doc.setFont('helvetica')
  doc.setFontSize(22)
  doc.setTextColor(...primaryColor)
  doc.text(data.businessName, 20, 25)

  doc.setFontSize(14)
  doc.setTextColor(...textColor)
  doc.text('RECIBO DE PAGO', 20, 38)

  doc.setFontSize(11)
  doc.setTextColor(...mutedColor)
  doc.text(data.period, 20, 46)

  doc.setDrawColor(...primaryColor)
  doc.setLineWidth(0.5)
  doc.line(20, 52, 190, 52)

  doc.setFontSize(12)
  doc.setTextColor(...textColor)
  doc.text('Empleado:', 20, 65)
  doc.setFont('helvetica', 'bold')
  doc.text(data.employeeName, 70, 65)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...mutedColor)
  doc.text('Valor neto a pagar:', 20, 78)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(22, 163, 74)
  doc.text(formatCurrencyCOP(data.netPay), 70, 78)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...textColor)
  doc.text('Metodo de pago:', 20, 92)
  doc.setTextColor(...mutedColor)
  doc.text(PAYMENT_METHOD_LABELS[data.paymentMethod] || data.paymentMethod, 70, 92)

  doc.setTextColor(...textColor)
  doc.text('Referencia:', 20, 102)
  doc.setTextColor(...mutedColor)
  doc.text(data.paymentReference || 'N/A', 70, 102)

  doc.setTextColor(...textColor)
  doc.text('Fecha de pago:', 20, 112)
  doc.setTextColor(...mutedColor)
  doc.text(formatDate(data.paidAt), 70, 112)

  doc.setDrawColor(...primaryColor)
  doc.setLineWidth(0.3)
  doc.line(20, 125, 190, 125)

  doc.setFontSize(8)
  doc.setTextColor(...mutedColor)
  doc.text('Generado por Pruegressy', 105, 285, { align: 'center' })

  const blob = doc.output('blob')
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export function generatePayrollReceiptPDFFromHTML(data: PayrollReceiptPDFData): string {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0F4C5C; margin: 0; font-size: 28px;">${data.businessName}</h1>
        <p style="color: #0F4C5C; font-size: 14px; margin: 5px 0;">RECIBO DE PAGO</p>
        <p style="color: #64748B; font-size: 12px; margin: 0;">${data.period}</p>
      </div>

      <div style="border-top: 2px solid #0F4C5C; border-bottom: 2px solid #0F4C5C; padding: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #475569; font-size: 14px;">Empleado:</td>
            <td style="padding: 8px 0; color: #0F172A; font-size: 14px; font-weight: bold; text-align: right;">${data.employeeName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #475569; font-size: 14px;">Valor neto a pagar:</td>
            <td style="padding: 8px 0; color: #16A34A; font-size: 18px; font-weight: bold; text-align: right;">${formatCurrencyCOP(data.netPay)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #475569; font-size: 14px;">Método de pago:</td>
            <td style="padding: 8px 0; color: #64748B; font-size: 14px; text-align: right;">${PAYMENT_METHOD_LABELS[data.paymentMethod] || data.paymentMethod}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #475569; font-size: 14px;">Referencia:</td>
            <td style="padding: 8px 0; color: #64748B; font-size: 14px; text-align: right;">${data.paymentReference || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #475569; font-size: 14px;">Fecha de pago:</td>
            <td style="padding: 8px 0; color: #64748B; font-size: 14px; text-align: right;">${formatDate(data.paidAt)}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <p style="color: #94A3B8; font-size: 11px; margin: 0;">Generado por Prügressy</p>
      </div>
    </div>
  `
}
