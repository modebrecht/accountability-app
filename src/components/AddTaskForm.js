import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
const repeatOptions = [
    { label: 'No repeat', value: 'none' },
    { label: 'Daily', value: 'daily' },
    { label: 'Every 2 days', value: 'every_2_days' },
    { label: 'Every 3 days', value: 'every_3_days' },
    { label: 'Weekdays (Mon-Fri)', value: 'weekly_mon,tue,wed,thu,fri' },
    { label: 'Mon/Wed/Fri', value: 'weekly_mon,wed,fri' },
    { label: 'Custom weekly target', value: 'weekly_3x' }
];
export function AddTaskForm({ onSubmit, onCancel }) {
    const [title, setTitle] = useState('');
    const [repeat, setRepeat] = useState('daily');
    const [customRepeat, setCustomRepeat] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!title.trim() || saving)
            return;
        const repeatValue = customRepeat.trim() || repeat;
        setSaving(true);
        setError(null);
        try {
            await onSubmit({
                title: title.trim(),
                repeat: repeatValue,
                due_date: dueDate || null,
                priority
            });
            setTitle('');
            setRepeat('daily');
            setCustomRepeat('');
            setDueDate('');
            setPriority(1);
            onCancel();
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unable to save task';
            setError(message);
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("form", { className: "add-task-form", onSubmit: handleSubmit, children: [_jsx("h3", { children: "Add a new task" }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Task title *" }), _jsx("input", { value: title, onChange: (event) => setTitle(event.target.value), placeholder: "Write the daily habit", required: true })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Repeat pattern" }), _jsx("select", { value: repeat, onChange: (event) => setRepeat(event.target.value), children: repeatOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) }), _jsx("input", { value: customRepeat, onChange: (event) => setCustomRepeat(event.target.value), placeholder: "Or enter custom pattern e.g. weekly_mon,wed" })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Due date" }), _jsx("input", { type: "date", value: dueDate, onChange: (event) => setDueDate(event.target.value) })] }), _jsxs("label", { className: "field", children: [_jsx("span", { children: "Priority (affects notifications)" }), _jsx("input", { type: "range", min: 0.1, max: 2, step: 0.1, value: priority, onChange: (event) => setPriority(Number(event.target.value)) }), _jsxs("small", { children: ["Current weight: ", priority.toFixed(1)] })] }), error ? _jsx("p", { className: "error", children: error }) : null, _jsxs("div", { className: "actions", children: [_jsx("button", { type: "submit", disabled: saving, children: saving ? 'Saving…' : 'Save task' }), _jsx("button", { type: "button", className: "secondary", onClick: onCancel, disabled: saving, children: "Cancel" })] })] }));
}
