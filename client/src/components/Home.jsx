import { useState } from 'react';
import { MessageCircle, Users, Settings } from 'lucide-react';
import { SocketProvider, useSocket } from '../context/SocketContext';
import UserMenu from './UserMenu';
import ChatsTab from './tabs/ChatsTab';
import GroupsTab from './tabs/GroupsTab';
import SettingsTab from './tabs/SettingsTab';

const TABS = [
  { id: 'chats', label: 'Chats', icon: MessageCircle, Component: ChatsTab },
  { id: 'groups', label: 'Groups', icon: Users, Component: GroupsTab },
  { id: 'settings', label: 'Settings', icon: Settings, Component: SettingsTab },
];

function ConnectionDot() {
  const { connected } = useSocket();
  return (
    <span
      className={`conn-dot ${connected ? 'on' : ''}`}
      title={connected ? 'Connected' : 'Connecting…'}
      aria-label={connected ? 'Connected' : 'Connecting'}
    />
  );
}

function HeaderUser({ user, onLogout }) {
  const { connected } = useSocket();
  return <UserMenu user={user} connected={connected} onLogout={onLogout} />;
}

export default function Home({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('chats');
  const [isViewingConversation, setIsViewingConversation] = useState(false);
  const current = TABS.find((t) => t.id === activeTab);
  const ActiveComponent = current.Component;

  return (
    <SocketProvider token={token}>
      <div className={`home-shell ${isViewingConversation ? 'conversation-open' : ''}`}>
        {!isViewingConversation && (
          <header className="home-header">
            <h1 className="home-title">
              {current.label} <ConnectionDot />
            </h1>
            <HeaderUser user={user} onLogout={onLogout} />
          </header>
        )}

        <section className="home-content">
          {current.id === 'settings' ? (
            <ActiveComponent user={user} token={token} onLogout={onLogout} />
          ) : (
            <ActiveComponent user={user} token={token} onViewChange={setIsViewingConversation} />
          )}
        </section>

        {!isViewingConversation && (
          <nav className="bottom-tabs" role="tablist">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                className={`bottom-tab ${activeTab === id ? 'active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </SocketProvider>
  );
}
