import React, { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'smartmart.pending.sales';

function useNetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return online;
}

export function App() {
  const online = useNetworkStatus();
  const [pending, setPending] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const statusText = useMemo(() => (online ? 'Online' : 'Offline'), [online]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  }, [pending]);

  useEffect(() => {
    if (!online || pending.length === 0) return;
    const sync = async () => {
      const remaining = [];
      for (const item of pending) {
        try {
          const response = await fetch('http://localhost:4000/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          });
          if (!response.ok) {
            remaining.push(item);
          }
        } catch {
          remaining.push(item);
        }
      }
      setPending(remaining);
    };
    sync();
  }, [online]);

  function recordSaleOfflineSafe() {
    const sale = {
      id: crypto.randomUUID(),
      total: 4500,
      createdAt: new Date().toISOString(),
      source: 'web-pos'
    };

    if (online) {
      fetch('http://localhost:4000/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale)
      }).catch(() => setPending((prev) => [...prev, sale]));
      return;
    }

    setPending((prev) => [...prev, sale]);
  }

  return (
    <main className="container">
      <h1>SmartMart POS Shell</h1>
      <p>
        Connection status: <strong className={online ? 'online' : 'offline'}>{statusText}</strong>
      </p>
      <p>Pending offline sales to sync: <strong>{pending.length}</strong></p>
      <button onClick={recordSaleOfflineSafe}>Record Demo Sale</button>
      <p className="note">This demonstrates offline detection and auto-sync when internet returns.</p>
    </main>
  );
}
