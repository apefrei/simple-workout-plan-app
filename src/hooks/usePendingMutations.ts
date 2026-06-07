import { useMutationState } from '@tanstack/react-query';

export function usePendingMutations(): number {
  const pendingMutations = useMutationState({
    filters: { status: 'pending' },
    select: (mutation) => mutation.state.status,
  });
  return pendingMutations.length;
}
