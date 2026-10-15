import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { api } from '../../services/api.js';
import { ErrorMessage } from '../ui/ErrorMessage.jsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';

export function ParticipantsTab({ tripId, participants, onRefresh, onToast }) {
  const [showAdd,   setShowAdd]   = useState(false);
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [addErr,    setAddErr]    = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [editName,  setEditName]  = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [delConfirm,setDelConfirm]= useState(null);
  const [opError,   setOpError]   = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return setAddErr('Name is required');
    setSaving(true); setAddErr(null);
    try {
      await api.addParticipant(tripId, { name, email });
      setName(''); setEmail(''); setShowAdd(false);
      onRefresh();
      onToast(`${name} added`);
    } catch (err) { setAddErr(err); }
    finally { setSaving(false); }
  }

  async function handleEdit(id) {
    if (!editName.trim()) return;
    try {
      await api.updateParticipant(id, { name: editName, email: editEmail });
      setEditId(null);
      onRefresh();
      onToast('Participant updated');
    } catch (err) { setOpError(err); }
  }

  async function handleDelete(id) {
    try {
      await api.deleteParticipant(id);
      setDelConfirm(null);
      onRefresh();
      onToast('Participant removed');
    } catch (err) {
      setDelConfirm(null);
      setOpError(err);
    }
  }

  return (
    <div>
      <ErrorMessage error={opError} />

      <div className="card">
        <div className="card-header">
          <span className="card-title">Participants ({participants.length})</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(s => !s)}>
            <Plus size={14} /> Add
          </button>
        </div>

        {showAdd && (
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
            <ErrorMessage error={addErr} />
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                className="form-input"
                style={{ flex: 1, minWidth: 140 }}
                placeholder="Full name *"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <input
                className="form-input"
                style={{ flex: 1, minWidth: 160 }}
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Adding...' : 'Add'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => { setShowAdd(false); setAddErr(null); }}>
                Cancel
              </button>
            </form>
          </div>
        )}

        {participants.length === 0 ? (
          <EmptyState icon="👥" title="No participants" description="Add people who will be splitting expenses on this trip." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Added</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {participants.map(p => (
                  <tr key={p.id}>
                    <td>
                      {editId === p.id ? (
                        <input className="form-input" style={{ padding: '5px 8px', fontSize: 13 }} value={editName} onChange={e => setEditName(e.target.value)} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar avatar-sm">{p.name[0].toUpperCase()}</div>
                          {p.name}
                        </div>
                      )}
                    </td>
                    <td>
                      {editId === p.id ? (
                        <input className="form-input" style={{ padding: '5px 8px', fontSize: 13 }} type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                      ) : (
                        <span style={{ color: 'var(--color-muted)', fontSize: 13 }}>{p.email || '—'}</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--color-muted)', fontSize: 13 }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        {editId === p.id ? (
                          <>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(p.id)} title="Save"><Check size={14} /></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)} title="Cancel"><X size={14} /></button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditId(p.id); setEditName(p.name); setEditEmail(p.email || ''); }} title="Edit">
                              <Pencil size={14} />
                            </button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => setDelConfirm(p)} title="Remove">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {delConfirm && (
        <ConfirmDialog
          title="Remove Participant"
          message={`Remove "${delConfirm.name}" from this trip? This is only possible if they have no recorded expenses.`}
          confirmLabel="Remove"
          danger
          onConfirm={() => handleDelete(delConfirm.id)}
          onCancel={() => setDelConfirm(null)}
        />
      )}
    </div>
  );
}
