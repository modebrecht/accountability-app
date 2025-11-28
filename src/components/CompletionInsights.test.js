import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CompletionInsights } from './CompletionInsights';
const baseProps = {
    loading: false,
    error: null,
    streak: { current: 3, best: 5 },
    last7Count: 4,
    last30Count: 12,
    dailySeries: Array.from({ length: 14 }, (_, index) => ({
        date: `2024-08-${String(index + 1).padStart(2, '0')}`,
        count: index % 3
    })),
    entries: Array.from({ length: 6 }, (_, index) => ({
        id: `entry-${index}`,
        task_id: 'task-1',
        user_id: 'user-1',
        completed_at: `2024-08-${String(14 - index).padStart(2, '0')}T12:00:00Z`,
        tasks: { title: `Task ${index + 1}` }
    }))
};
describe('CompletionInsights', () => {
    it('renders summary cards and chart data', () => {
        render(_jsx(CompletionInsights, { ...baseProps }));
        expect(screen.getByText(/current streak/i)).toBeInTheDocument();
        expect(screen.getByText(/5 days/i)).toBeInTheDocument();
        expect(screen.getByText(/last 7 days/i)).toBeInTheDocument();
        expect(screen.getAllByRole('article')).toHaveLength(4);
        const bars = screen.getAllByRole('presentation', { hidden: true });
        expect(bars.length).toBeGreaterThanOrEqual(14);
    });
    it('shows a limited list of recent entries', () => {
        render(_jsx(CompletionInsights, { ...baseProps }));
        const recent = screen.getAllByRole('listitem');
        expect(recent).toHaveLength(5);
        expect(recent[0]).toHaveTextContent('Task 1');
    });
    it('renders empty state copy when there are no entries', () => {
        render(_jsx(CompletionInsights, { ...baseProps, entries: [], dailySeries: Array.from({ length: 14 }, (_, index) => ({
                date: `2024-08-${String(index + 1).padStart(2, '0')}`,
                count: 0
            })), last7Count: 0, last30Count: 0, streak: { current: 0, best: 0 } }));
        expect(screen.getByText(/no completion history yet/i)).toBeInTheDocument();
    });
});
