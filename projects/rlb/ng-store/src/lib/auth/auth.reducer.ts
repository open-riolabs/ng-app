import { createFeature, createReducer, on } from '@ngrx/store';
import { authsFeatureKey, initialAuthState } from './auth.model';
import { AuthActionsInternal } from './auth.actions';

export const authsFeature = createFeature({
  name: authsFeatureKey,
  reducer: createReducer(
    initialAuthState,
    on(AuthActionsInternal.setLoading, (state, action) => ({ ...state, loading: action.loading })),
    on(AuthActionsInternal.setUser, (state, action) => ({ ...state, user: action.user })),
    on(AuthActionsInternal.setAuth, (state, action) => ({ ...state, ...action.auth })),
    on(AuthActionsInternal.reset, () => ({ ...initialAuthState }))
  )
});

export const authReducer = authsFeature.reducer;

export const {
  selectAccessToken,
  selectIdToken,
  selectAuthState,
  selectLoading,
  selectUser,
  selectIsAuth
} = authsFeature;