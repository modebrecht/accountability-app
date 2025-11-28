import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
export default function AuthPage() {
    const { signIn, signUp } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(null);
    const [error, setError] = useState(null);
    const handleSubmit = async (event, action) => {
        event.preventDefault();
        if (submitting)
            return;
        setError(null);
        setSubmitting(action);
        try {
            if (action === 'login') {
                await signIn(email, password);
            }
            else {
                await signUp(email, password);
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unable to authenticate';
            setError(message);
        }
        finally {
            setSubmitting(null);
        }
    };
    return (_jsx("div", { className: "auth-page", children: _jsxs("form", { className: "auth-card", children: [_jsxs("header", { children: [_jsx("h1", { children: "Accountability App" }), _jsx("p", { children: "Sign in or create an account to manage your tasks." })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Email" }), _jsx("input", { type: "email", value: email, onChange: (event) => setEmail(event.target.value), placeholder: "you@example.com", required: true })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Password" }), _jsx("input", { type: "password", value: password, onChange: (event) => setPassword(event.target.value), placeholder: "Minimum 6 characters", required: true, minLength: 6 })] }), error ? _jsx("p", { className: "error", children: error }) : null, _jsxs("div", { className: "actions", children: [_jsx("button", { type: "submit", onClick: (event) => handleSubmit(event, 'login'), disabled: submitting !== null, children: submitting === 'login' ? 'Logging in…' : 'Login' }), _jsx("button", { type: "submit", onClick: (event) => handleSubmit(event, 'register'), disabled: submitting !== null, className: "secondary", children: submitting === 'register' ? 'Registering…' : 'Register' })] })] }) }));
}
