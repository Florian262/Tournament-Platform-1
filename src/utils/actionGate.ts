import toast from 'react-hot-toast';

export function requireAuth(user: unknown, openAuthModal: () => void, action: () => void) {
  if (!user) {
    openAuthModal();
    return;
  }
  try {
    action();
  } catch (err) {
    // keep console for debugging but surface a user-friendly toast
    const error = err as { message?: string };
    console.error('Action execution error', err);
    toast.error(error?.message || 'Action failed');
  }
}

export default requireAuth;
