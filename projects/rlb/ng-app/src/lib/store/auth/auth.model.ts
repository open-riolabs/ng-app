export const authsFeatureKey = 'auth';

export interface Auth {
  currentProvider: string | null;
}

export const initialAuthState: Auth = {
  currentProvider: null,
};

export interface AuthState { [authsFeatureKey]: Auth; }