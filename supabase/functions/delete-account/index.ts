import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return response({ error: 'Método não permitido.' }, 405)

  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return response({ error: 'Autenticação necessária.' }, 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return response({ error: 'Solicitação inválida.' }, 400)
  }

  if (!body || typeof body !== 'object' || !('confirmation' in body) || body.confirmation !== 'EXCLUIR MINHA CONTA') {
    return response({ error: 'Confirmação inválida.' }, 400)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    console.error('Secrets obrigatórios da função não estão configurados.')
    return response({ error: 'A exclusão não está disponível no momento.' }, 503)
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return response({ error: 'Sessão inválida ou expirada.' }, 401)

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userData.user.id)
  if (deleteError) {
    console.error('Falha administrativa ao excluir conta.', deleteError)
    return response({ error: 'Não foi possível excluir a conta. Nenhuma alteração foi confirmada.' }, 500)
  }

  return response({ success: true })
})
