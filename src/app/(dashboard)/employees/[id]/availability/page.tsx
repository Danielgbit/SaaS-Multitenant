import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AvailabilityPage({ params }: Props) {
  const { id } = await params
  redirect(`/employees/${id}?tab=availability`)
}
