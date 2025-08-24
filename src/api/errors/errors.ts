export class AuthRequiredError extends Error {
  status = 403;
  constructor(message = 'Auth required') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

export const isAuthRequiredError = (err: any): boolean => {
  // 1) Sunucudan gelen axios error
  const r = err?.response;
  const msg = String(
    r?.data?.message ?? r?.data?.error ?? err?.message ?? '',
  ).toLowerCase();

  if (r?.status === 403 && msg.includes('forbidden')) return true;

  // 2) Daha önce çevrilmiş custom error
  if (err instanceof AuthRequiredError) return true;

  return false;
};
