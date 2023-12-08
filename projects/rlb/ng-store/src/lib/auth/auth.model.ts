export const authsFeatureKey = 'auth';

export interface Auth<T = any> {
  userId: string | null;
  username: string | null;
  user: T | null;
  idToken: string | null;
  accessToken: string | null;
  isAuth: boolean;
  loading: boolean;
}

export const initialAuthState: Auth = {
  accessToken: null,
  idToken: null,
  username: null,
  isAuth: false,
  user: null,
  userId: null,
  loading: false,
}

export interface AuthState { [authsFeatureKey]: Auth }