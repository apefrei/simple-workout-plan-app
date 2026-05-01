import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  saveMessage,
  getMessages,
  clearMessages,
  deleteMessage,
  type StoredChatMessage,
} from '../lib/ai/chatStorage';

export type { StoredChatMessage };

export function useChatHistory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ['chatHistory', userId],
    queryFn: () => (userId ? getMessages(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: Infinity,
  });

  const addMessage = useMutation({
    mutationFn: async (message: Omit<StoredChatMessage, 'userId'>) => {
      if (!userId) throw new Error('Not authenticated');
      const full: StoredChatMessage = { ...message, userId };
      await saveMessage(full);
      return full;
    },
    onMutate: async (message) => {
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey: ['chatHistory', userId] });
      const previous = queryClient.getQueryData<StoredChatMessage[]>(['chatHistory', userId]);
      queryClient.setQueryData<StoredChatMessage[]>(['chatHistory', userId], (old = []) => [
        ...old,
        { ...message, userId },
      ]);
      return { previous };
    },
    onError: (_err, _msg, context) => {
      if (context?.previous && userId) {
        queryClient.setQueryData(['chatHistory', userId], context.previous);
      }
    },
  });

  const removeMessage = useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: ['chatHistory', userId] });
    },
  });

  const clearAll = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('Not authenticated');
      return clearMessages(userId);
    },
    onSuccess: () => {
      if (userId) queryClient.setQueryData(['chatHistory', userId], []);
    },
  });

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    addMessage,
    removeMessage,
    clearAll,
  };
}
