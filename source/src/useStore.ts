import { useEffect, useState } from 'react';
import { subscribe } from './store';
export function useStore() { const [, set] = useState(0); useEffect(() => subscribe(() => set(x => x + 1)), []); }
