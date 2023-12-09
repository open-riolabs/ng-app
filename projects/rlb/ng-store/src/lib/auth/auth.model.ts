export const authsFeatureKey = 'auth';

export interface Auth<T = any> {
  user: T | null;
  idToken: string | null;
  accessToken: string | null;
  isAuth: boolean;
  loading: boolean;
}

export const initialAuthState: Auth = {
  accessToken: null,
  idToken: null,
  isAuth: false,
  user: null,
  loading: false,
}

export interface AuthState { [authsFeatureKey]: Auth }