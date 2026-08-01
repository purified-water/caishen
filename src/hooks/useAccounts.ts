import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Account, AccountType } from '../types/database'

const KEY = ['accounts']

export function useAccounts() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('name')
      if (error) throw error
      return data as Account[]
    },
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: { name: string; type: AccountType }) => {
      const { error } = await supabase.from('accounts').insert({
        user_id: user!.id,
        name: input.name,
        type: input.type,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      id: string
      name: string
      type: AccountType
      is_active: boolean
    }) => {
      const { error } = await supabase
        .from('accounts')
        .update({
          name: input.name,
          type: input.type,
          is_active: input.is_active,
        })
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('accounts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
