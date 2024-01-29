import { initialAppContextState } from './app-context.model';
import { appReducer } from './app-context.reducer';

describe('Sidebar Reducer', () => {
  describe('unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as any;

      const result = appReducer(initialAppContextState, action);

      expect(result).toBe(initialAppContextState);
    });
  });
});
