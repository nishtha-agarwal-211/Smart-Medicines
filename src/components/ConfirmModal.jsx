import React from 'react';

/**
 * Reusable confirmation modal — replaces browser confirm() dialogs.
 *
 * Usage:
 *   const [confirm, setConfirm] = useState(null);
 *   // show: setConfirm({ title, message, onConfirm })
 *   // hide: setConfirm(null)
 *
 *   {confirm && (
 *     <ConfirmModal
 *       title={confirm.title}
 *       message={confirm.message}
 *       onConfirm={confirm.onConfirm}
 *       onCancel={() => setConfirm(null)}
 *     />
 *   )}
 */
export default function ConfirmModal({
    title = 'Are you sure?',
    message,
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    danger = true,
    onConfirm,
    onCancel,
}) {
    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div
                className="confirm-modal"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
            >
                <div className="confirm-icon">{danger ? '🗑️' : 'ℹ️'}</div>
                <h3 id="confirm-title" className="confirm-title">{title}</h3>
                {message && <p className="confirm-message">{message}</p>}
                <div className="confirm-actions">
                    <button className="btn-secondary" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        className={danger ? 'btn-danger' : 'btn-primary'}
                        onClick={() => { onConfirm(); onCancel(); }}
                        autoFocus
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
