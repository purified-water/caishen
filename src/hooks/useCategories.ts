import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { DEFAULT_CATEGORIES } from '../lib/defaultCategories'
import type { Category, CategoryType } from '../types/database'

const KEY = ['categories']

export function useCategories() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('type')
        .order('name')
      if (error) throw error
      return data as Category[]
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: { name: string; type: CategoryType; icon?: string }) => {
      const { error } = await supabase.from('categories').insert({
        user_id: user!.id,
        name: input.name,
        type: input.type,
        icon: input.icon ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      id: string
      name: string
      type: CategoryType
      icon?: string
    }) => {
      const { error } = await supabase
        .from('categories')
        .update({ name: input.name, type: input.type, icon: input.icon ?? null })
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useSeedDefaultCategories() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (existing: Category[]) => {
      const existingKeys = new Set(
        existing.map((c) => `${c.type}:${c.name.trim().toLowerCase()}`),
      )
      const missing = DEFAULT_CATEGORIES.filter(
        (c) => !existingKeys.has(`${c.type}:${c.name.toLowerCase()}`),
      )
      if (missing.length === 0) return

      const { error } = await supabase.from('categories').insert(
        missing.map((c) => ({ user_id: user!.id, name: c.name, type: c.type })),
      )
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
