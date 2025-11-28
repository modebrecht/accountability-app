import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { useSmartNotifications } from './useSmartNotifications';
const baseTask = {
    id: 'task-1',
    user_id: 'user-1',
    title: 'Meditate',
    completed: false,
    completed_at: null,
    created_at: '2024-08-01T00:00:00Z',
    due_date: null,
    repeat: 'daily',
    priority: 1,
    recentCompletions: 0
};
describe('useSmartNotifications', () => {
    const mockRequestPermission = vi.fn();
    const mockNotificationConstructor = vi.fn();
    const originalNotification = globalThis.Notification;
    beforeEach(() => {
        vi.useFakeTimers();
        mockRequestPermission.mockReset();
        mockNotificationConstructor.mockReset();
        // @ts-expect-error override for tests
        globalThis.Notification = Object.assign(mockNotificationConstructor, {
            permission: 'default',
            requestPermission: mockRequestPermission
        });
    });
    afterEach(() => {
        vi.useRealTimers();
        globalThis.Notification = originalNotification;
    });
    it('requests permission and schedules reminders when enabled', async () => {
        mockRequestPermission.mockResolvedValue('granted');
        const { result } = renderHook(() => useSmartNotifications([baseTask], 1000));
        expect(result.current.status).toBe('default');
        await act(async () => {
            await result.current.enableNotifications();
        });
        expect(mockRequestPermission).toHaveBeenCalledTimes(1);
        expect(result.current.status).toBe('active');
        await waitFor(() => {
            vi.advanceTimersByTime(1100);
            expect(mockNotificationConstructor).toHaveBeenCalled();
        });
    });
    it('does not schedule timers when notifications are unsupported', () => {
        // Simulate environment without Notification API
        // @ts-expect-error override for tests
        globalThis.Notification = undefined;
        const { result } = renderHook(() => useSmartNotifications([baseTask], 1000));
        expect(result.current.supported).toBe(false);
        expect(result.current.status).toBe('unsupported');
    });
    it('pauses reminders when disabled', async () => {
        mockRequestPermission.mockResolvedValue('granted');
        const { result } = renderHook(() => useSmartNotifications([baseTask], 1000));
        await act(async () => {
            await result.current.enableNotifications();
        });
        expect(result.current.status).toBe('active');
        act(() => {
            result.current.disableNotifications();
        });
        expect(result.current.status).toBe('paused');
        vi.advanceTimersByTime(2000);
        expect(mockNotificationConstructor).toHaveBeenCalledTimes(1); // initial immediate notification only
    });
});
