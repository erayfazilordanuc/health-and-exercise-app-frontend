import {FlatList} from 'react-native';
import { SessionCard } from './SessionCard';

export function SessionList({sessions}: {sessions: SessionDTO[]}) {
  return (
    <FlatList
      data={sessions}
      keyExtractor={item => item.sessionId}
      renderItem={({item}) => <SessionCard session={item} />}
      contentContainerStyle={{padding: 16}}
    />
  );
}
