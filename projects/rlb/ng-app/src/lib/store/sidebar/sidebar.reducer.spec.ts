import { initialSidebarState } from './sidebar.model';
import { sidebarReducer } from './sidebar.reducer';

describe('Sidebar Reducer', () => {
  describe('unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as any;

      const result = sidebarReducer(initialSidebarState, action);

      expect(result).toBe(initialSidebarState);
    });
  });
});
