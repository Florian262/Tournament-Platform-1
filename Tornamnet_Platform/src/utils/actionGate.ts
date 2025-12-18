import toast from 'react-hot-toast';

export function requireAuth(user: any, openAuthModal: () => void, action: () => void) {
  if (!user) {
    openAuthModal();
    return;
  }
  try {
    action();
  } catch (err) {
    // keep console for debugging but surface a user-friendly toast
    console.error('Action execution error', err);
    toast.error((err as any)?.message || 'Action failed');
  }
}

export default requireAuth;
