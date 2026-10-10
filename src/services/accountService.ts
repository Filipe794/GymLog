import { supabase } from '../lib/supabaseClient'

export async function deleteAuthenticatedAccount(confirmation: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: { confirmation },
  })

  if (error) {
    if (error.name === 'FunctionsFetchError') {
      throw new Error('Não foi possível contactar a função de exclusão. Verifique se ela foi publicada no Supabase.')
    }

    if (error.name === 'FunctionsHttpError') {
      const response = await error.context?.clone().json().catch(() => null)
      throw new Error(response?.error ?? 'A função de exclusão recusou a solicitação.')
    }

    throw new Error(error.message || 'Não foi possível solicitar a exclusão da conta.')
  }
  if (!data?.success) throw new Error('A conta não foi excluída. Tente novamente.')
}
