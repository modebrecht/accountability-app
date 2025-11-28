import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { AddTaskForm } from '../components/AddTaskForm';
import { pickTaskForNotification } from '../lib/tasks';
import { useSmartNotifications } from '../hooks/useSmartNotifications';
import { CompletionInsights } from '../components/CompletionInsights';
import { useCompletionHistory } from '../hooks/useCompletionHistory';
const tabs = [
    { id: 'active', label: 'Active Tasks' },
    { id: 'completed', label: 'Completed (7 days)' },
    { id: 'archived', label: 'Archive' }
];
export default function TaskListPage() {
    const { user, signOut } = useAuth();
    const { active, completed, archived, loading, error, createTask, toggleTaskCompletion } = useTasks(user?.id);
    const [tab, setTab] = useState('active');
    const [showForm, setShowForm] = useState(false);
    const [actionError, setActionError] = useState(null);
    const currentTasks = useMemo(() => {
        if (tab === 'completed')
            return completed;
        if (tab === 'archived')
            return archived;
        return active;
    }, [tab, active, completed, archived]);
    const suggestedTask = useMemo(() => pickTaskForNotification(active), [active]);
    const { supported: notificationsSupported, status: notificationStatus, permission: notificationPermission, enableNotifications, disableNotifications } = useSmartNotifications(active);
    const completionHistory = useCompletionHistory(user?.id);
    const handleToggle = async (task) => {
        setActionError(null);
        try {
            await toggleTaskCompletion(task);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unable to update task';
            setActionError(message);
        }
    };
    return (_jsxs("div", { className: "task-page", children: [_jsxs("header", { className: "task-header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Welcome back" }), _jsx("h1", { children: "Your accountability board" }), _jsx("p", { className: "muted", children: user?.email })] }), _jsxs("div", { className: "header-actions", children: [_jsx("button", { className: "secondary", onClick: () => setShowForm((prev) => !prev), children: showForm ? 'Close form' : 'Add task' }), _jsx("button", { onClick: signOut, children: "Sign out" })] })] }), showForm ? _jsx(AddTaskForm, { onSubmit: createTask, onCancel: () => setShowForm(false) }) : null, _jsxs("section", { className: "suggestion-card", children: [_jsx("p", { className: "eyebrow", children: "Smart reminder" }), suggestedTask ? (_jsxs(_Fragment, { children: [_jsx("h3", { children: suggestedTask.title }), _jsxs("p", { className: "muted", children: ["Repeat pattern: ", suggestedTask.repeat ?? 'none', " \u00B7 Priority weight", ' ', (suggestedTask.priority ?? 1).toFixed(1), " \u00B7", ' ', suggestedTask.recentCompletions ?? 0, " hits last 30d"] })] })) : (_jsx("p", { className: "muted", children: "No repeatable tasks to notify today." }))] }), _jsx(CompletionInsights, { ...completionHistory }), _jsxs("section", { className: "notification-settings", children: [_jsx("p", { className: "eyebrow", children: "Browser notifications" }), !notificationsSupported ? (_jsx("p", { className: "muted", children: "Notifications are not supported in this browser." })) : (_jsxs(_Fragment, { children: [_jsxs("p", { className: "muted", children: ["Status: ", notificationStatus === 'active' ? 'Enabled' : notificationStatus, notificationStatus === 'denied' ? ' · Allow notifications in your browser settings.' : ''] }), notificationStatus === 'active' ? (_jsx("button", { className: "secondary", onClick: disableNotifications, children: "Pause reminders" })) : (_jsx("button", { onClick: enableNotifications, children: notificationPermission === 'granted' ? 'Start reminders' : 'Enable notifications' }))] }))] }), _jsx("nav", { className: "tablist", children: tabs.map((item) => (_jsxs("button", { className: item.id === tab ? 'active' : undefined, onClick: () => setTab(item.id), children: [item.label, _jsx("span", { className: "count", children: item.id === 'active'
                                ? active.length
                                : item.id === 'completed'
                                    ? completed.length
                                    : archived.length })] }, item.id))) }), loading ? _jsx("p", { children: "Loading tasks\u2026" }) : null, error ? _jsx("p", { className: "error", children: error }) : null, actionError ? _jsx("p", { className: "error", children: actionError }) : null, !loading && currentTasks.length === 0 ? (_jsx("div", { className: "empty", children: _jsx("p", { children: "No tasks in this view yet." }) })) : null, _jsx("ul", { className: "task-list", children: currentTasks.map((task) => (_jsxs("li", { className: `task-card ${task.completed ? 'completed' : ''}`, children: [_jsxs("button", { onClick: () => handleToggle(task), className: "task-toggle", children: [_jsx("span", { className: "checkbox", "aria-hidden": "true", children: task.completed ? '✓' : '' }), _jsxs("div", { children: [_jsx("p", { className: "task-title", children: task.title }), _jsxs("p", { className: "task-meta", children: [task.repeat ?? 'no repeat', task.due_date ? ` · Due ${task.due_date}` : '', ' · ', task.recentCompletions ?? 0, " hits last 30d"] })] })] }), task.completed && task.completed_at ? (_jsxs("p", { className: "completed-at", children: ["Completed at ", new Date(task.completed_at).toLocaleDateString()] })) : null] }, task.id))) })] }));
}
