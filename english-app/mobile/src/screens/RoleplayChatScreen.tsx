import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { api } from '../services/api';

interface Message {
  id?: string;
  sender: 'AI' | 'USER';
  content: string;
  translation?: string;
}

interface Props {
  scenarioId: string;
  onFinishSession: (result: any) => void;
  onBack: () => void;
}

export const RoleplayChatScreen: React.FC<Props> = ({ scenarioId, onFinishSession, onBack }) => {
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showTranslation, setShowTranslation] = useState<Record<number, boolean>>({});

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    startNewSession();
  }, [scenarioId]);

  const speakText = (text: string) => {
    Speech.stop();
    Speech.speak(text, { language: 'en-US', rate: 0.85 });
  };

  const startNewSession = async () => {
    try {
      const res = await api.post('/roleplay/sessions/start', { scenarioId });
      setSession(res.data);
      const msgs = res.data.messages || [];
      setMessages(msgs);

      // Auto speak initial AI message
      if (msgs.length > 0 && msgs[0].sender === 'AI') {
        speakText(msgs[0].content);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể bắt đầu phiên nhập vai');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isSending || !session) return;

    const userMsg: Message = { sender: 'USER', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const res = await api.post(`/roleplay/sessions/${session.id}/chat`, { message: text.trim() });
      const { aiMessage, suggestions: newSuggestions } = res.data;

      setMessages((prev) => [...prev, aiMessage]);
      setSuggestions(newSuggestions || []);

      // Auto speak new AI message
      if (aiMessage?.content) {
        speakText(aiMessage.content);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setIsSending(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleFinish = async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const res = await api.post(`/roleplay/sessions/${session.id}/evaluate`);
      onFinishSession(res.data);
    } catch (err) {
      console.error(err);
      onBack();
    }
  };

  const toggleTranslation = (index: number) => {
    setShowTranslation((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (isLoading || !session) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  const scenario = session.scenario;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{scenario?.icon} {scenario?.title}</Text>
          <Text style={styles.headerSubtitle}>Tự động phát giọng đọc AI 🔊</Text>
        </View>

        <TouchableOpacity style={styles.finishHeaderButton} onPress={handleFinish}>
          <Text style={styles.finishHeaderText}>Kết thúc 🏁</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Messages List */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'USER';
          const isTranslating = showTranslation[idx];

          return (
            <View key={idx} style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAi]}>
              {!isUser ? <Text style={styles.avatar}>🤖</Text> : null}

              <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
                <View style={styles.bubbleHeaderRow}>
                  <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextAi]}>
                    {msg.content}
                  </Text>

                  {!isUser ? (
                    <TouchableOpacity style={styles.speakerBtn} onPress={() => speakText(msg.content)}>
                      <Text style={styles.speakerIcon}>🔊</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {isUser ? (
                  <View style={styles.grammarCheckTag}>
                    <Text style={styles.grammarCheckText}>✓ Ngữ pháp chính xác! +5 XP</Text>
                  </View>
                ) : null}

                {!isUser && msg.translation ? (
                  <View style={styles.translationContainer}>
                    <TouchableOpacity onPress={() => toggleTranslation(idx)}>
                      <Text style={styles.toggleTranslationText}>
                        {isTranslating ? 'Ẩn dịch 🇻🇳' : 'Dịch nghĩa 🇻🇳'}
                      </Text>
                    </TouchableOpacity>
                    {isTranslating ? (
                      <Text style={styles.translationText}>{msg.translation}</Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}

        {isSending ? (
          <View style={[styles.msgRow, styles.msgRowAi]}>
            <Text style={styles.avatar}>🤖</Text>
            <View style={[styles.bubble, styles.bubbleAi]}>
              <ActivityIndicator color="#4F46E5" size="small" />
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Quick Suggestions Chips */}
      {suggestions.length > 0 && !isSending ? (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsLabel}>💡 Gợi ý câu trả lời nhanh (Chạm để chọn):</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
            {suggestions.map((sugg, sIdx) => (
              <TouchableOpacity
                key={sIdx}
                style={styles.suggestionChip}
                onPress={() => handleSendMessage(sugg)}
                activeOpacity={0.8}
              >
                <Text style={styles.suggestionText}>"{sugg}"</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Nhập câu trả lời Tiếng Anh..."
          placeholderTextColor="#94A3B8"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSendMessage()}
          editable={!isSending}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={() => handleSendMessage()}
          disabled={!inputText.trim() || isSending}
          activeOpacity={0.8}
        >
          <Text style={styles.sendButtonText}>Gửi 🚀</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    backgroundColor: '#F8FAFC',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 20,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  finishHeaderButton: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  finishHeaderText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: 'bold',
  },
  chatList: {
    padding: 16,
    gap: 14,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  msgRowAi: {
    justifyContent: 'flex-start',
  },
  avatar: {
    fontSize: 24,
    marginRight: 8,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bubbleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  msgText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  msgTextUser: {
    color: '#FFFFFF',
  },
  msgTextAi: {
    color: '#0F172A',
  },
  speakerBtn: {
    padding: 2,
  },
  speakerIcon: {
    fontSize: 16,
  },
  grammarCheckTag: {
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  grammarCheckText: {
    color: '#E0E7FF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  translationContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  toggleTranslationText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  translationText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    marginLeft: 16,
    marginBottom: 6,
  },
  suggestionsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  suggestionText: {
    color: '#3730A3',
    fontSize: 13,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'web' ? 75 : 85,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
