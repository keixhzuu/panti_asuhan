import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where, limit } from 'firebase/firestore';
import { firestore } from '../lib/firebase';

export default function useFirestoreCollection(collectionName, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refs = [collection(firestore, collectionName)];

    if (options.whereField && options.whereValue !== undefined) {
      refs.push(where(options.whereField, '==', options.whereValue));
    }

    if (options.orderByField) {
      refs.push(orderBy(options.orderByField, options.orderDirection || 'desc'));
    }

    if (options.limitCount) {
      refs.push(limit(options.limitCount));
    }

    const q = query(...refs);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, options.whereField, options.whereValue, options.orderByField, options.orderDirection, options.limitCount]);

  return { data, loading };
}
