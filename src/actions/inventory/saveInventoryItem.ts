'use server'

import {
  createInventoryItemForm,
  type CreateInventoryItemFormState,
} from './createInventoryItem'
import {
  updateInventoryItemForm,
  type UpdateInventoryItemFormState,
} from './updateInventoryItem'

export type SaveInventoryItemFormState =
  | CreateInventoryItemFormState
  | UpdateInventoryItemFormState

export async function saveInventoryItem(
  prevState: SaveInventoryItemFormState,
  formData: FormData
): Promise<SaveInventoryItemFormState> {
  const intent = formData.get('intent')?.toString()

  if (intent === 'update') {
    return updateInventoryItemForm(
      prevState as UpdateInventoryItemFormState,
      formData
    )
  }

  if (intent === 'create') {
    return createInventoryItemForm(
      prevState as CreateInventoryItemFormState,
      formData
    )
  }

  return { success: false, error: 'Acción inválida' }
}
