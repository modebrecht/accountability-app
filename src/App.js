import { jsx as _jsx } from "react/jsx-runtime";
import AuthPage from './pages/AuthPage';
import TaskListPage from './pages/TaskListPage';
import { useAuth } from './contexts/AuthContext';
function App() {
    const { session, loading } = useAuth();
    if (loading) {
        return (_jsx("div", { className: "auth-page", children: _jsx("div", { className: "auth-card", children: _jsx("p", { children: "Checking your session\u2026" }) }) }));
    }
    return session ? _jsx(TaskListPage, {}) : _jsx(AuthPage, {});
}
export default App;
