function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name} (see README)`);
  return value;
}

export const BASE_URL = required('API_BASE_URL');
export const LOGIN_SOURCE = required('LOGIN_SOURCE');
