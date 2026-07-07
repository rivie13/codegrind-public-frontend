import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loadHook = async ({ userData, updateProfileImpl } = {}) => {
  vi.resetModules();

  const toast = vi.fn();
  const navigate = vi.fn();
  const updateProfile = vi.fn(updateProfileImpl || (async () => ({})));
  const logout = vi.fn().mockResolvedValue({});
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  vi.doMock('@chakra-ui/react', () => ({
    useToast: () => toast,
  }));

  vi.doMock('react-router-dom', () => ({
    useNavigate: () => navigate,
  }));

  vi.doMock('../../../services/api', () => ({
    api: {
      auth: {
        updateProfile,
        logout,
      },
    },
  }));

  vi.doMock('../../../utils/core/logger', () => ({
    default: logger,
  }));

  const mod = await import('./useProfileForm');
  const refreshProfileData = vi.fn();
  const onSuccess = vi.fn();

  const hook = renderHook(() => mod.default(userData, onSuccess, refreshProfileData));

  return {
    hook,
    toast,
    updateProfile,
    refreshProfileData,
    onSuccess,
  };
};

describe('useProfileForm', () => {
  const OriginalImage = global.Image;

  beforeEach(() => {
    vi.restoreAllMocks();

    class MockImage {
      set src(url) {
        if (url.includes('bad-image')) {
          this.onerror?.();
        } else {
          this.onload?.();
        }
      }
    }

    global.Image = MockImage;
  });

  afterEach(() => {
    global.Image = OriginalImage;
  });

  it('requires current password when non-Google users change email', async () => {
    const userData = {
      username: 'alice',
      email: 'old@example.com',
      hasPassword: true,
      googleId: null,
    };
    const { hook, updateProfile } = await loadHook({ userData });

    act(() => {
      hook.result.current.setFormData((prev) => ({
        ...prev,
        email: 'new@example.com',
      }));
    });

    await act(async () => {
      await hook.result.current.handleUpdateProfile({ preventDefault: vi.fn() });
    });

    expect(updateProfile).not.toHaveBeenCalled();
    expect(hook.result.current.error).toBe('Password is required to change email address');
  });

  it('updates profile successfully and clears password fields', async () => {
    const userData = {
      username: 'alice',
      email: 'alice@example.com',
      bio: 'hello',
      avatarUrl: '',
      hasPassword: true,
      googleId: null,
    };
    const { hook, updateProfile, refreshProfileData, onSuccess, toast } = await loadHook({
      userData,
    });

    act(() => {
      hook.result.current.setFormData((prev) => ({
        ...prev,
        username: 'alice_2',
        currentPassword: 'Current1!',
        newPassword: 'Stronger1!',
        confirmPassword: 'Stronger1!',
      }));
    });

    await act(async () => {
      await hook.result.current.handleUpdateProfile({ preventDefault: vi.fn() });
    });

    expect(updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'alice_2',
        email: 'alice@example.com',
        currentPassword: 'Current1!',
        newPassword: 'Stronger1!',
      })
    );
    expect(refreshProfileData).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Profile Updated!',
        status: 'success',
      })
    );
    expect(hook.result.current.formData.currentPassword).toBe('');
    expect(hook.result.current.formData.newPassword).toBe('');
    expect(hook.result.current.formData.confirmPassword).toBe('');
  });

  it('blocks submission when avatar URL format is invalid', async () => {
    const userData = {
      username: 'alice',
      email: 'alice@example.com',
      avatarUrl: '',
      hasPassword: true,
    };
    const { hook, updateProfile } = await loadHook({ userData });

    act(() => {
      hook.result.current.setFormData((prev) => ({
        ...prev,
        avatarUrl: 'not-a-real-url',
      }));
    });

    await waitFor(() => {
      expect(hook.result.current.avatarError).toContain('URL format is not valid for images');
    });

    await act(async () => {
      await hook.result.current.handleUpdateProfile({ preventDefault: vi.fn() });
    });

    expect(updateProfile).not.toHaveBeenCalled();
    expect(hook.result.current.error).toContain('avatar URL cannot be used');
  });

  it('shows warning flow when backend requires logout for pending email change', async () => {
    const userData = {
      username: 'alice',
      email: 'old@example.com',
      hasPassword: true,
      googleId: null,
    };
    const { hook, updateProfile, toast } = await loadHook({
      userData,
      updateProfileImpl: async () => ({
        requiresLogout: true,
        emailPending: true,
        pendingEmail: 'new@example.com',
      }),
    });

    act(() => {
      hook.result.current.setFormData((prev) => ({
        ...prev,
        email: 'new@example.com',
        currentPassword: 'Current1!',
      }));
    });

    await act(async () => {
      await hook.result.current.handleUpdateProfile({ preventDefault: vi.fn() });
    });

    expect(updateProfile).toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Email Change Initiated',
        status: 'warning',
      })
    );
  });

  it('surfaces API errors from updateProfile', async () => {
    const userData = {
      username: 'alice',
      email: 'alice@example.com',
      hasPassword: true,
      googleId: null,
    };
    const { hook, toast } = await loadHook({
      userData,
      updateProfileImpl: async () => {
        throw new Error('Profile service unavailable');
      },
    });

    act(() => {
      hook.result.current.setFormData((prev) => ({
        ...prev,
        currentPassword: 'Current1!',
        newPassword: 'Stronger1!',
        confirmPassword: 'Stronger1!',
      }));
    });

    await act(async () => {
      await hook.result.current.handleUpdateProfile({ preventDefault: vi.fn() });
    });

    expect(hook.result.current.error).toBe('Profile service unavailable');
    expect(hook.result.current.isLoading).toBe(false);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Profile update failed',
        status: 'error',
      })
    );
  });
});
