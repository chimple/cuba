import type { AssignmentCartData } from '../../services/api/ServiceApi';

const ASSIGNMENT_CART_STORAGE_PREFIX = 'assignment_cart:';

const isValidAssignmentCartData = (
  data: unknown,
): data is AssignmentCartData => {
  if (!data || typeof data !== 'object') return false;

  const parsed = data as AssignmentCartData;
  return (
    typeof parsed.created_at === 'string' &&
    typeof parsed.updated_at === 'string' &&
    (typeof parsed.lessons === 'string' || parsed.lessons === null)
  );
};

export const getAssignmentCartStorageKey = (userId: string): string =>
  `${ASSIGNMENT_CART_STORAGE_PREFIX}${userId}`;

export const readAssignmentCartFromStorage = (
  userId: string,
): AssignmentCartData | undefined => {
  const key = getAssignmentCartStorageKey(userId);
  const raw =
    typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidAssignmentCartData(parsed)) return;
    return parsed;
  } catch (error) {
    console.error('Failed to parse assignment cart from storage', error);
    return;
  }
};

export const writeAssignmentCartToStorage = (
  userId: string,
  cart: AssignmentCartData,
): void => {
  if (typeof localStorage === 'undefined') return;
  const key = getAssignmentCartStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(cart));
};
