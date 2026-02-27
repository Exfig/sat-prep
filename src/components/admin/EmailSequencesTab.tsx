import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

/* ─── Types ─── */

interface EmailSequence {
  id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  is_active: boolean;
  cancel_on_event: string | null;
  created_at: string;
  updated_at: string;
}

interface EmailStep {
  id: string;
  sequence_id: string;
  step_number: number;
  subject: string;
  body_html: string;
  delay_hours: number;
  send_condition: string | null;
  created_at: string;
}

interface SeqMetrics {
  sequence_id: string;
  sequence_name: string;
  step_count: number;
  total_sends: number;
  queued: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  cancelled: number;
}

interface StepMetrics {
  step_id: string;
  step_number: number;
  subject: string;
  total_sends: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
}

/* ─── Helpers ─── */

function formatDelay(hours: number): string {
  if (hours === 0) return 'Immediate';
  if (hours < 24) return hours === 1 ? '1 hour' : `${hours} hours`;
  const days = hours / 24;
  if (Number.isInteger(days)) {
    if (days === 1) return '1 day';
    if (days === 7) return '1 week';
    if (days % 7 === 0) return `${days / 7} week${days / 7 > 1 ? 's' : ''}`;
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  return `${hours} hours`;
}

function pct(num: number, den: number): string {
  if (den === 0) return '—';
  return `${Math.round((num / den) * 100)}%`;
}

/* ─── Component ─── */

export default function EmailSequencesTab() {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [metrics, setMetrics] = useState<SeqMetrics[]>([]);
  const [selectedSeq, setSelectedSeq] = useState<EmailSequence | null>(null);
  const [steps, setSteps] = useState<EmailStep[]>([]);
  const [stepMetrics, setStepMetrics] = useState<StepMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showSeqModal, setShowSeqModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [editSeq, setEditSeq] = useState<Partial<EmailSequence> | null>(null);
  const [editStep, setEditStep] = useState<Partial<EmailStep> | null>(null);

  /* ─── Data loading ─── */

  useEffect(() => { loadSequences(); }, []);

  async function loadSequences() {
    setLoading(true);
    setError('');
    try {
      const [seqRes, mRes] = await Promise.all([
        supabase.from('email_sequences').select('*').order('created_at', { ascending: false }),
        supabase.rpc('admin_email_sequence_metrics'),
      ]);
      if (seqRes.error) throw seqRes.error;
      setSequences(seqRes.data || []);
      setMetrics(mRes.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load sequences');
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(seq: EmailSequence) {
    setSelectedSeq(seq);
    setView('detail');
    setLoading(true);
    setError('');
    try {
      const [stepsRes, mRes] = await Promise.all([
        supabase.from('email_sequence_steps').select('*').eq('sequence_id', seq.id).order('step_number'),
        supabase.rpc('admin_email_step_metrics', { p_sequence_id: seq.id }),
      ]);
      if (stepsRes.error) throw stepsRes.error;
      setSteps(stepsRes.data || []);
      setStepMetrics(mRes.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load steps');
    } finally {
      setLoading(false);
    }
  }

  /* ─── Sequence CRUD ─── */

  async function toggleActive(seq: EmailSequence) {
    const { error: err } = await supabase
      .from('email_sequences')
      .update({ is_active: !seq.is_active, updated_at: new Date().toISOString() })
      .eq('id', seq.id);
    if (err) { setError(err.message); return; }
    setSequences(prev => prev.map(s => s.id === seq.id ? { ...s, is_active: !s.is_active } : s));
    if (selectedSeq?.id === seq.id) setSelectedSeq(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
  }

  async function saveSequence() {
    if (!editSeq?.name || !editSeq?.trigger_event) return;
    setError('');
    try {
      const payload = {
        name: editSeq.name,
        description: editSeq.description || null,
        trigger_event: editSeq.trigger_event,
        cancel_on_event: editSeq.cancel_on_event || null,
        is_active: editSeq.is_active ?? true,
        updated_at: new Date().toISOString(),
      };
      if (editSeq.id) {
        const { error: err } = await supabase.from('email_sequences').update(payload).eq('id', editSeq.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('email_sequences').insert(payload);
        if (err) throw err;
      }
      setShowSeqModal(false);
      setEditSeq(null);
      await loadSequences();
      // If we were editing the currently open sequence, refresh detail
      if (editSeq.id && selectedSeq?.id === editSeq.id) {
        const updated = { ...selectedSeq, ...payload } as EmailSequence;
        setSelectedSeq(updated);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    }
  }

  async function deleteSequence(id: string) {
    if (!confirm('Delete this sequence and all its steps? This cannot be undone.')) return;
    const { error: err } = await supabase.from('email_sequences').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    if (selectedSeq?.id === id) { setView('list'); setSelectedSeq(null); }
    await loadSequences();
  }

  /* ─── Step CRUD ─── */

  async function saveStep() {
    if (!editStep?.subject || !editStep?.body_html || !selectedSeq) return;
    setError('');
    try {
      if (editStep.id) {
        const { error: err } = await supabase
          .from('email_sequence_steps')
          .update({
            step_number: editStep.step_number,
            subject: editStep.subject,
            body_html: editStep.body_html,
            delay_hours: editStep.delay_hours ?? 0,
            send_condition: editStep.send_condition || null,
          })
          .eq('id', editStep.id);
        if (err) throw err;
      } else {
        const nextNum = steps.length > 0 ? Math.max(...steps.map(s => s.step_number)) + 1 : 1;
        const { error: err } = await supabase
          .from('email_sequence_steps')
          .insert({
            sequence_id: selectedSeq.id,
            step_number: editStep.step_number ?? nextNum,
            subject: editStep.subject,
            body_html: editStep.body_html,
            delay_hours: editStep.delay_hours ?? 0,
            send_condition: editStep.send_condition || null,
          });
        if (err) throw err;
      }
      setShowStepModal(false);
      setEditStep(null);
      await openDetail(selectedSeq);
    } catch (e: any) {
      setError(e.message || 'Failed to save step');
    }
  }

  async function deleteStep(stepId: string) {
    if (!confirm('Delete this step?')) return;
    const { error: err } = await supabase.from('email_sequence_steps').delete().eq('id', stepId);
    if (err) { setError(err.message); return; }
    if (selectedSeq) await openDetail(selectedSeq);
  }

  /* ─── Render ─── */

  if (loading && sequences.length === 0) {
    return <div className="text-center py-12 text-slate-500">Loading email sequences...</div>;
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-2 font-bold hover:text-red-900">×</button>
        </div>
      )}

      {view === 'list' ? (
        /* ═══════ LIST VIEW ═══════ */
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Email Sequences</h2>
            <button
              onClick={() => { setEditSeq({ is_active: true }); setShowSeqModal(true); }}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + New Sequence
            </button>
          </div>

          {sequences.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-lg mb-1">No email sequences yet</p>
              <p className="text-sm">Create your first sequence to start automating emails.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500 text-xs uppercase tracking-wider">
                    <th className="pb-2 font-medium">Sequence</th>
                    <th className="pb-2 font-medium">Trigger</th>
                    <th className="pb-2 font-medium text-center">Steps</th>
                    <th className="pb-2 font-medium text-center">Active</th>
                    <th className="pb-2 font-medium text-right">Sent</th>
                    <th className="pb-2 font-medium text-right">Open %</th>
                    <th className="pb-2 font-medium text-right">Click %</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sequences.map(seq => {
                    const m = metrics.find(x => x.sequence_id === seq.id);
                    // Total delivered = delivered + opened + clicked (status gets overwritten)
                    const totalDelivered = (m?.delivered ?? 0) + (m?.opened ?? 0) + (m?.clicked ?? 0);
                    const totalOpened = (m?.opened ?? 0) + (m?.clicked ?? 0); // clicked were also opened
                    return (
                      <tr
                        key={seq.id}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => openDetail(seq)}
                      >
                        <td className="py-3">
                          <div className="font-medium text-slate-900">{seq.name}</div>
                          {seq.cancel_on_event && (
                            <span className="text-xs text-amber-600">cancels on: {seq.cancel_on_event}</span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">{seq.trigger_event}</span>
                        </td>
                        <td className="py-3 text-center tabular-nums">{m?.step_count ?? 0}</td>
                        <td className="py-3 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => toggleActive(seq)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${seq.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
                            title={seq.is_active ? 'Active — click to disable' : 'Inactive — click to enable'}
                          >
                            <span className={`block w-4 h-4 bg-white rounded-full shadow absolute top-0.5 transition-transform ${seq.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </button>
                        </td>
                        <td className="py-3 text-right tabular-nums">{m?.sent ?? 0}</td>
                        <td className="py-3 text-right tabular-nums">{pct(totalOpened, totalDelivered)}</td>
                        <td className="py-3 text-right tabular-nums">{pct(m?.clicked ?? 0, totalDelivered)}</td>
                        <td className="py-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => { setEditSeq(seq); setShowSeqModal(true); }}
                            className="text-indigo-600 hover:text-indigo-800 mr-3 text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteSequence(seq.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : selectedSeq ? (
        /* ═══════ DETAIL VIEW ═══════ */
        <div>
          <button
            onClick={() => { setView('list'); setSelectedSeq(null); loadSequences(); }}
            className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center gap-1"
          >
            &larr; Back to sequences
          </button>

          {/* Sequence header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{selectedSeq.name}</h2>
              {selectedSeq.description && (
                <p className="text-sm text-slate-500 mt-1">{selectedSeq.description}</p>
              )}
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                <span>
                  Trigger:{' '}
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{selectedSeq.trigger_event}</span>
                </span>
                {selectedSeq.cancel_on_event && (
                  <span>
                    Cancels on:{' '}
                    <span className="font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">{selectedSeq.cancel_on_event}</span>
                  </span>
                )}
                <span className={selectedSeq.is_active ? 'text-green-600 font-medium' : 'text-slate-400'}>
                  {selectedSeq.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <button
              onClick={() => { setEditSeq(selectedSeq); setShowSeqModal(true); }}
              className="px-3 py-1.5 text-sm border border-slate-500 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors shrink-0"
            >
              Edit Settings
            </button>
          </div>

          {/* Sequence-level metrics summary */}
          {(() => {
            const m = metrics.find(x => x.sequence_id === selectedSeq.id);
            if (!m || m.total_sends === 0) return null;
            const totalDelivered = m.delivered + m.opened + m.clicked;
            const totalOpened = m.opened + m.clicked;
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total Sent', value: m.sent + totalDelivered },
                  { label: 'Open Rate', value: pct(totalOpened, totalDelivered) },
                  { label: 'Click Rate', value: pct(m.clicked, totalDelivered) },
                  { label: 'Bounce Rate', value: pct(m.bounced, m.total_sends) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-slate-500 mb-1">{label}</div>
                    <div className="text-lg font-semibold text-slate-900 tabular-nums">{value}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Steps */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-slate-900">Steps ({steps.length})</h3>
            <button
              onClick={() => {
                const nextNum = steps.length > 0 ? Math.max(...steps.map(s => s.step_number)) + 1 : 1;
                setEditStep({ sequence_id: selectedSeq.id, delay_hours: 0, step_number: nextNum });
                setShowStepModal(true);
              }}
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Add Step
            </button>
          </div>

          {steps.length === 0 ? (
            <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg">
              No steps yet. Add the first email in this sequence.
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map(step => {
                const sm = stepMetrics.find(x => x.step_id === step.id);
                const stepDelivered = sm ? sm.delivered + sm.opened + sm.clicked : 0;
                const stepOpened = sm ? sm.opened + sm.clicked : 0;
                return (
                  <div key={step.id} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold flex items-center justify-center shrink-0">
                            {step.step_number}
                          </span>
                          <span className="font-medium text-slate-900 truncate">{step.subject}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 ml-8">
                          <span>Delay: <span className="font-medium text-slate-700">{formatDelay(step.delay_hours)}</span></span>
                          {step.send_condition && (
                            <span>Condition: <code className="bg-slate-100 px-1 rounded">{step.send_condition}</code></span>
                          )}
                        </div>
                        {sm && sm.total_sends > 0 && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 ml-8 mt-2 pt-2 border-t border-slate-100">
                            <span>Sent: <b className="text-slate-700">{sm.sent + stepDelivered}</b></span>
                            <span>Open: <b className="text-slate-700">{pct(stepOpened, stepDelivered)}</b></span>
                            <span>Click: <b className="text-slate-700">{pct(sm.clicked, stepDelivered)}</b></span>
                            <span>Bounce: <b className="text-slate-700">{pct(sm.bounced, sm.total_sends)}</b></span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3 ml-4 shrink-0">
                        <button
                          onClick={() => { setEditStep(step); setShowStepModal(true); }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteStep(step.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* ═══════ SEQUENCE MODAL ═══════ */}
      {showSeqModal && editSeq && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { setShowSeqModal(false); setEditSeq(null); }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {editSeq.id ? 'Edit Sequence' : 'New Sequence'}
            </h3>
            <div className="space-y-4">
              <Field label="Name" required>
                <input
                  type="text"
                  value={editSeq.name || ''}
                  onChange={e => setEditSeq(p => ({ ...p!, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="e.g., Welcome Series"
                />
              </Field>
              <Field label="Description">
                <input
                  type="text"
                  value={editSeq.description || ''}
                  onChange={e => setEditSeq(p => ({ ...p!, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Optional description"
                />
              </Field>
              <Field label="Trigger Event" required>
                <input
                  type="text"
                  value={editSeq.trigger_event || ''}
                  onChange={e => setEditSeq(p => ({ ...p!, trigger_event: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="e.g., signup, purchase, manual"
                />
              </Field>
              <Field label="Cancel On Event">
                <input
                  type="text"
                  value={editSeq.cancel_on_event || ''}
                  onChange={e => setEditSeq(p => ({ ...p!, cancel_on_event: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="e.g., purchased (optional)"
                />
              </Field>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editSeq.is_active ?? true}
                  onChange={e => setEditSeq(p => ({ ...p!, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700">Active</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => { setShowSeqModal(false); setEditSeq(null); }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSequence}
                disabled={!editSeq.name || !editSeq.trigger_event}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editSeq.id ? 'Save Changes' : 'Create Sequence'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ STEP MODAL ═══════ */}
      {showStepModal && editStep && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { setShowStepModal(false); setEditStep(null); }}>
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {editStep.id ? 'Edit Step' : 'New Step'}
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Field label="Step #" className="w-24">
                  <input
                    type="number"
                    min={1}
                    value={editStep.step_number ?? 1}
                    onChange={e => setEditStep(p => ({ ...p!, step_number: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </Field>
                <Field label="Delay (hours)" className="w-40">
                  <input
                    type="number"
                    min={0}
                    value={editStep.delay_hours ?? 0}
                    onChange={e => setEditStep(p => ({ ...p!, delay_hours: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <span className="text-xs text-slate-400 mt-0.5 block">{formatDelay(editStep.delay_hours ?? 0)}</span>
                </Field>
              </div>
              <Field label="Subject" required>
                <input
                  type="text"
                  value={editStep.subject || ''}
                  onChange={e => setEditStep(p => ({ ...p!, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="e.g., How was Day 1, {{first_name}}?"
                />
              </Field>
              <Field label="Body HTML" required>
                <textarea
                  value={editStep.body_html || ''}
                  onChange={e => setEditStep(p => ({ ...p!, body_html: e.target.value }))}
                  rows={12}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="<h1>Hello {{first_name}}</h1>&#10;&#10;<p>Your content here...</p>&#10;&#10;<a href='{{unsubscribe_url}}'>Unsubscribe</a>"
                />
                <span className="text-xs text-slate-400 mt-0.5 block">
                  Variables: {'{{first_name}}'}, {'{{unsubscribe_url}}'}
                </span>
              </Field>
              <Field label="Send Condition (JSON, optional)">
                <input
                  type="text"
                  value={editStep.send_condition || ''}
                  onChange={e => setEditStep(p => ({ ...p!, send_condition: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder='e.g., {"tier": "free"}'
                />
                <span className="text-xs text-slate-400 mt-0.5 block">
                  Only send if user matches. Keys: tier, tier_not, tier_in
                </span>
              </Field>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => { setShowStepModal(false); setEditStep(null); }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveStep}
                disabled={!editStep.subject || !editStep.body_html}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editStep.id ? 'Save Step' : 'Add Step'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Tiny helper component ─── */

function Field({ label, required, className, children }: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
