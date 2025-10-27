import { createFeature, createReducer, on } from '@ngrx/store';
import { AuthActionsInternal } from './auth.actions';
import { authsFeatureKey, initialAuthState } from './auth.model';

export const authsFeature = createFeature({
  name: authsFeatureKey,
  reducer: createReducer(
    initialAuthState,
    on(AuthActionsInternal.logout, (state) => ({ ...state })),
    on(AuthActionsInternal.setCurrentProvider, (state, action) => {
      if (action.currentProvider && state.currentProvider !== action.currentProvider) {
        return { ...state, currentProvider: action.currentProvider };
      }
      return state;
    })
  )
});

export const authReducer = authsFeature.reducer;

export const {
  selectAuthState,
  selectCurrentProvider
} = authsFeature;