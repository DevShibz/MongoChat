import { Check, CheckCheck, Users } from 'lucide-react';
import { initials } from '../../lib/format';

export function Avatar({ name, online = false, group = false, size }) {
  const style = size ? { width: size, height: size, fontSize: size * 0.36 } : undefined;
  return (
    <div className={`chat-avatar ${group ? 'group' : ''}`} style={style}>
      {group && !name ? <Users size={20} /> : initials(name)}
      {online && <span className="online-dot" />}
    </div>
  );
}

export function StatusTicks({ status }) {
  if (status === 'pending') return <span className="tick-pending">•</span>;
  if (status === 'sent') return <Check size={14} />;
  return <CheckCheck size={14} className={status === 'read' ? 'tick-read' : ''} />;
}
