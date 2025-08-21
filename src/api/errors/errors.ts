export class KvkkRequiredError extends Error {
  status = 403;
  constructor(message = 'KVKK consent required') {
    super(message);
    this.name = 'KvkkRequiredError';
  }
}
export const isKvkkRequiredError = (err: any): boolean => {
  // 1) Sunucudan gelen axios error
  const r = err?.response;
  const msg = String(
    r?.data?.message ?? r?.data?.error ?? err?.message ?? '',
  ).toLowerCase();
  if (r?.status === 403 && msg.includes('kvkk consent required')) return true;

  // 2) Daha önce çevrilmiş custom error
  if (err instanceof KvkkRequiredError) return true;

  return false;
};
