export const authsFeatureKey = 'auth';

export interface Auth {
  currentProvider: string | null;
  loading: boolean;
}

export const initialAuthState: Auth = {
  currentProvider: null,
  loading: false,
};

export interface AuthState { [authsFeatureKey]: Auth; }