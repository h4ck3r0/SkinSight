import { useState, useEffect } from 'react';

export const useSimplePeer = () => {
  const [Peer, setPeer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSimplePeer = async () => {
      try {
        // Add polyfills before importing
        if (typeof global === 'undefined') {
          window.global = window;
        }
        if (typeof process === 'undefined') {
          window.process = { env: {} };
        }

        const simplePeerModule = await import('simple-peer');
        setPeer(() => simplePeerModule.default);
        setLoading(false);
      } catch (err) {
        console.error('Error loading simple-peer:', err);
        setError(err);
        setLoading(false);
      }
    };

    loadSimplePeer();
  }, []);

  return { Peer, loading, error };
}; 