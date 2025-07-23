import { jwtDecode } from 'jwt-decode';

export type JWTPayload = {
  id: number;
  email: string;
  nom?: string;
  role?: string;
  exp?: number;
  iat?: number;
  // Ajoute ici tous les champs que ton backend encode dans le JWT
};

export function getUserFromCookie(): JWTPayload | null {
  try {
    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='));

    if (!cookie) return null;

    const token = cookie.split('=')[1];
    const decoded = jwtDecode<JWTPayload>(token);
    console.log('Utilisateur connecté :', decoded);

    return decoded;
  } catch (e) {
    console.error('Erreur de décodage du token', e);
    return null;
  }
}
