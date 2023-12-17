import { initialAuthState } from './auth.model';
import { authReducer } from './auth.reducer';

describe('Auth Reducer', () => {
  describe('unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as any;

      const result = authReducer(initialAuthState, action);

      expect(result).toBe(initialAuthState);
    });
  });
});
