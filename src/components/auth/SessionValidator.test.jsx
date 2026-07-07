import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadComponent = async ({
  pathname = '/profile',
  search = '',
  checkImpl = async () => ({ authenticated: true, user: { id: 1 } }),
} = {}) => {
  vi.resetModules();

  const navigate = vi.fn();
  const check = vi.fn(checkImpl);

  vi.doMock('react-router-dom', () => ({
    useLocation: () => ({ pathname, search }),
    useNavigate: () => navigate,
  }));

  vi.doMock('../../services/api', () => ({
    default: {
      auth: { check },
    },
  }));

  vi.doMock('../../utils/core/logger', () => ({
    default: {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  }));

  const mod = await import('./SessionValidator');

  return {
    SessionValidator: mod.default,
    navigate,
    check,
  };
};

describe('SessionValidator', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('does not validate session on public routes', async () => {
    localStorage.setItem('user_id', '7');

    const { SessionValidator, check } = await loadComponent({
      pathname: '/leaderboards',
    });

    render(
      <SessionValidator>
        <div>child</div>
      </SessionValidator>
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(check).not.toHaveBeenCalled();
  });

  it('redirects to home when protected-route validation fails', async () => {
    localStorage.setItem('user_id', '12');
    localStorage.setItem('last_login', '2020-01-01T00:00:00.000Z');
    localStorage.setItem('auth_provider', 'local');

    const { SessionValidator, navigate, check } = await loadComponent({
      pathname: '/profile',
      checkImpl: async () => ({ authenticated: false }),
    });

    render(
      <SessionValidator>
        <div>profile</div>
      </SessionValidator>
    );

    await waitFor(() => {
      expect(check).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/', {
        state: { from: '/profile' },
      });
    });

    expect(localStorage.getItem('user_id')).toBeNull();
    expect(localStorage.getItem('last_login')).toBeNull();
    expect(localStorage.getItem('auth_provider')).toBeNull();
  });
});
