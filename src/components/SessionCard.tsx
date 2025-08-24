import {Text, View} from 'react-native';

export function SessionCard({session}: {session: SessionState}) {
  const formatMs = (ms: number) => {
    const min = Math.floor(ms / 60000);
    return `${min} dk`;
  };

  return (
    <View className="bg-white dark:bg-neutral-900 p-4 mb-3 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700">
      <Text className="text-base font-semibold text-neutral-900 dark:text-white">
        Başlangıç: {new Date(session.startedAt).toLocaleString()}
      </Text>
      <Text className="text-sm text-neutral-600 dark:text-neutral-400">
        Aktif Süre: {formatMs(session.activeMs)}
      </Text>
      {session.lastHeartbeatAt && (
        <Text className="text-sm text-neutral-600 dark:text-neutral-400">
          Son Aktivite: {new Date(session.lastHeartbeatAt).toLocaleTimeString()}
        </Text>
      )}
    </View>
  );
}
