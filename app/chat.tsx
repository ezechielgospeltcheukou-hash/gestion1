import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { api } from '../src/api/api';

export default function ChatScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const user = await api.getUser();
      setCurrentUser(user);
      const response = await api.getMessages();
      if (response.success && response.data && user) {
        const contactId = parseInt(id as string);
        const filtered = response.data.filter((msg: any) =>
          (msg.fromUserId === user.id && msg.toUserId === contactId) ||
          (msg.fromUserId === contactId && msg.toUserId === user.id)
        );
        setMessages(filtered);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
    }, [loadMessages])
  );

  const handleSend = async () => {
    if (!messageText.trim() || !id) return;

    setSending(true);
    try {
      const response = await api.createMessage({
        toUserId: parseInt(id as string),
        content: messageText.trim()
      });
      if (response.success) {
        setMessageText('');
        loadMessages();
      } else {
        Alert.alert('Erreur', response.message || 'Impossible d\'envoyer le message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{name || 'Discussion'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <View style={styles.chatContainer}>
          <ScrollView style={styles.messagesList}>
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucun message</Text>
              </View>
            ) : (
              messages.map(msg => (
                <View key={msg.id} style={styles.messageRow}>
                  <View style={[styles.messageBubble, msg.fromUserId === currentUser?.id ? styles.sentBubble : styles.receivedBubble]}>
                    <Text style={styles.messageText}>{msg.content}</Text>
                    <Text style={styles.messageTime}>{formatDate(msg.createdAt)}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Écrire un message..."
              multiline
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
              disabled={sending}
            >
              <Send size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    backgroundColor: '#059669',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6b7280', fontSize: 16 },
  chatContainer: { flex: 1, flexDirection: 'column' },
  messagesList: { flex: 1, padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#6b7280' },
  messageRow: { marginBottom: 12, flexDirection: 'row', justifyContent: 'flex-start' },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'white'
  },
  sentBubble: { marginLeft: 'auto', backgroundColor: '#059669' },
  receivedBubble: { marginRight: 'auto', backgroundColor: 'white' },
  messageText: { fontSize: 16, color: '#111827' },
  messageTime: { fontSize: 10, color: '#9ca3af', marginTop: 4, textAlign: 'right' },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100
  },
  sendButton: {
    marginLeft: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
