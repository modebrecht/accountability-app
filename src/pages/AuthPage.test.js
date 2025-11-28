import { jsx as _jsx } from "react/jsx-runtime";
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AuthPage from './AuthPage';
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({
        signIn: mockSignIn,
        signUp: mockSignUp,
        signOut: vi.fn()
    })
}));
describe('AuthPage', () => {
    beforeEach(() => {
        mockSignIn.mockReset();
        mockSignUp.mockReset();
    });
    it('dispatches login flow and disables buttons during submit', async () => {
        mockSignIn.mockResolvedValue(undefined);
        render(_jsx(AuthPage, {}));
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'hunter2' } });
        const loginButton = screen.getByRole('button', { name: /login/i });
        fireEvent.click(loginButton);
        expect(loginButton).toBeDisabled();
        await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('user@example.com', 'hunter2'));
    });
    it('invokes register handler when Register is clicked', async () => {
        mockSignUp.mockResolvedValue(undefined);
        render(_jsx(AuthPage, {}));
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@user.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret12' } });
        fireEvent.click(screen.getByRole('button', { name: /register/i }));
        await waitFor(() => expect(mockSignUp).toHaveBeenCalledWith('new@user.com', 'secret12'));
    });
    it('shows error message when auth fails', async () => {
        mockSignIn.mockRejectedValue(new Error('Invalid credentials'));
        render(_jsx(AuthPage, {}));
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bad@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret12' } });
        fireEvent.click(screen.getByRole('button', { name: /login/i }));
        await waitFor(() => expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument());
    });
});
