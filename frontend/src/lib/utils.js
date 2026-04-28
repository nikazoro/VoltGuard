import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const getAuthToken = () => {
  return localStorage.getItem('ecocharge_token');
};

export const setAuthToken = (token) => {
  localStorage.setItem('ecocharge_token', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('ecocharge_token');
};

export const getUserFromToken = (token) => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
};