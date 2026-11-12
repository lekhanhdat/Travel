import AsyncStorage from '@react-native-async-storage/async-storage';
import LocalStorageCommon from '../utils/LocalStorageCommon';
import {localStorageKey} from '../common/constants';

export const chatKey = (name: 'CHAT_HISTORY' | 'CHAT_SESSION_ID', accountId: string) =>
  `${localStorageKey[name]}:${accountId}`;

let migration: Promise<void> | undefined;
let writes = Promise.resolve();
let revision = 0;
const listeners = new Set<() => void>();
export const chatRevision = () => revision;
export const subscribeChatSession = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};
export function invalidateChatSession() {
  revision++;
  listeners.forEach(listener => listener());
}
export async function chatAccountId(): Promise<string> {
  // Legacy data has no owner: discard it, never migrate it into an account.
  if (!migration) {
    migration = AsyncStorage.multiRemove([localStorageKey.CHAT_HISTORY, localStorageKey.CHAT_SESSION_ID])
      .catch(error => {migration = undefined; throw error;});
  }
  await migration;
  const account = await LocalStorageCommon.getItem(localStorageKey.AVT);
  return account?.id != null ? String(account.id) : 'guest';
}
export function writeChat(key: string, value: unknown, version = revision) {
  const operation = writes.then(async () => {
    if (version === revision) {await LocalStorageCommon.setItem(key, value);}
  });
  writes = operation.catch(() => {});
  return operation;
}
/**
 * Remove an account's chat data from the device.
 * Logout keeps the session id (`keepSession`): it is useless without that account's token and lets
 * the chat restore the history stored in Neon after the next login. Account deletion removes all.
 */
export async function clearAccountChat(accountId: string, {keepSession = false} = {}) {
  invalidateChatSession();
  const keys = [chatKey('CHAT_HISTORY', accountId), localStorageKey.CHAT_HISTORY, localStorageKey.CHAT_SESSION_ID];
  if (!keepSession) {keys.push(chatKey('CHAT_SESSION_ID', accountId));}
  const operation = writes.then(() => AsyncStorage.multiRemove(keys));
  writes = operation.catch(() => {});
  await operation;
}
