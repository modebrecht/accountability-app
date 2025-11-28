import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { differenceInDays, computeCurrentStreak, computeBestStreak, toDayKey } from './useCompletionHistory';
describe('differenceInDays', () => {
    it('returns positive differences when a is after b', () => {
        expect(differenceInDays('2024-08-05', '2024-08-01')).toBe(4);
    });
    it('returns negative differences when a is before b', () => {
        expect(differenceInDays('2024-08-01', '2024-08-05')).toBe(-4);
    });
});
describe('computeCurrentStreak', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-08-05T10:00:00Z'));
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    it('counts consecutive days up to today', () => {
        const days = new Set(['2024-08-05', '2024-08-04', '2024-08-03']);
        expect(computeCurrentStreak(days)).toBe(3);
    });
    it('stops when a gap exists', () => {
        const days = new Set(['2024-08-05', '2024-08-03']);
        expect(computeCurrentStreak(days)).toBe(1);
    });
});
describe('computeBestStreak', () => {
    it('tracks the longest chain irrespective of order', () => {
        const days = new Set(['2024-08-01', '2024-08-02', '2024-08-04', '2024-08-05', '2024-08-06']);
        expect(computeBestStreak(days)).toBe(3);
    });
    it('returns zero when there are no days', () => {
        expect(computeBestStreak(new Set())).toBe(0);
    });
});
describe('toDayKey', () => {
    it('normalizes ISO string to YYYY-MM-DD', () => {
        const date = new Date('2024-08-05T23:59:59Z');
        expect(toDayKey(date)).toBe('2024-08-05');
    });
});
