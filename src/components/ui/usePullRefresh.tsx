import React, { useCallback, useRef, useState } from 'react';
import { RefreshControl } from 'react-native';
import { palette } from '../../theme';

/**
 * Pull-to-refresh for any ScrollView / FlatList: pass the returned element as `refreshControl`.
 * The spinner stays up until `reload` settles; errors are left to `reload` to report.
 */
export function usePullRefresh(reload: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);
  const reloadRef = useRef(reload);
  reloadRef.current = reload;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reloadRef.current();
    } catch {
      // The screen's own loader shows any error.
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={palette.teal}
      colors={[palette.teal]}
      progressBackgroundColor={palette.surface}
    />
  );
}
