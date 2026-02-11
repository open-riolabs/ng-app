import { createFeature, createReducer, on } from '@ngrx/store';
import { AclActions } from './acl.actions';
import { aclFeatureKey, initialAclState } from './acl.model';

export const aclFeature = createFeature({
  name: aclFeatureKey,
  reducer: createReducer(
    initialAclState,
    on(AclActions.loadACL, (state) => ({
      ...state,
      loading: true,
      loaded: false
    })),
    on(AclActions.loadACLSuccess, (state, { resources }) => ({
      ...state,
      resources,
      loaded: true,
      loading: false
    })),
    on(AclActions.loadACLFailure, (state, { error }) => ({
      ...state,
      error,
      loading: false,
      loaded: true // We mark as loaded to unblock the UI even if the fetch fails
    })),
    on(AclActions.reset, () => ({ ...initialAclState }))
  )
});

export const aclReducer = aclFeature.reducer;

export const {
  selectAclState,
  selectResources,
  selectLoading,
  selectLoaded
} = aclFeature;
