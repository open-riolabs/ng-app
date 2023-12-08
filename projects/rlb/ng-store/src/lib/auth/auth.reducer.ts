import { createFeature, createReducer, on } from '@ngrx/store';
import { authsFeatureKey, initialAuthState } from './auth.model';
import { AuthActionsInternal } from './auth.actions';

export const authsFeature = createFeature({
  name: authsFeatureKey,
  reducer: createReducer(
    initialAuthState,
    on(AuthActionsInternal.setLoading, (state, action) => ({ ...state, loading: action.loading })),
    on(AuthActionsInternal.setUser, (state, action) => ({ ...state, user: action.user })),
    on(AuthActionsInternal.setIdToken, (state, action) => ({ ...state, idToken: action.token })),
    on(AuthActionsInternal.setAccessToken, (state, action) => ({ ...state, accessToken: action.token })),
    on(AuthActionsInternal.setIsAuthenticated, (state, action) => ({ ...state, isAuth: action.auth })),
    on(AuthActionsInternal.setUsername, (state, action) => ({ ...state, userId: action.username })),
    on(AuthActionsInternal.setUserId, (state, action) => ({ ...state, userId: action.userId })),
    on(AuthActionsInternal.setAuth, (state, action) => ({ ...state, ...action.auth })),
    on(AuthActionsInternal.reset, () => ({ ...initialAuthState }))
  )
});

export const authReducer = authsFeature.reducer;

export const {
  selectAccessToken,
  selectIdToken,
  selectUsername,
  selectAuthState,
  selectLoading,
  selectUser,
  selectUserId,
  selectIsAuth
} = authsFeature;