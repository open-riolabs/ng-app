import { initialNavbarState } from './navbar.model';
import { navbarReducer } from './navbar.reducer';

describe('Navbar Reducer', () => {
  describe('unknown action', () => {
    it('should return the previous state', () => {
      const action = {} as any;

      const result = navbarReducer(initialNavbarState, action);

      expect(result).toBe(initialNavbarState);
    });
  });
});
