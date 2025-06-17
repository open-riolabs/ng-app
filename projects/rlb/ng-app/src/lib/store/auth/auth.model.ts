export const authsFeatureKey = 'auth';

export interface Auth<T = any> {
  user: T | null;
  idToken: string | null | undefined;
  accessToken: string | null | undefined;
  isAuth: boolean;
  loading: boolean;
  currentProvider: string | null;
}

export const initialAuthState: Auth = {
  accessToken: null,
  idToken: null,
  isAuth: false,
  user: null,
  loading: false,
  currentProvider: null,
};

export interface AuthState<User = any> { [authsFeatureKey]: Auth<User>; }
