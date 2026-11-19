import apiClient from './apiClient';
import { getItem, STORAGE_KEYS } from '../storage/storage';
import { useStore } from '../../store';

/**
 * Resolves the authentication access token from argument, storage, or store.
 */
export const resolveAccessToken = explicitToken => {
  if (explicitToken && typeof explicitToken === 'string') {
    return explicitToken;
  }

  try {
    const stored = getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (stored && typeof stored === 'string') {
      return stored;
    }
  } catch (e) {}

  try {
    const storeToken = useStore?.getState?.()?.token;
    if (storeToken && typeof storeToken === 'string') {
      return storeToken;
    }
  } catch (e) {}

  return null;
};

/**
 * Extracts assistant response string across varying API response schemas.
 */
export const extractReplyText = data => {
  if (!data) return '';
  if (typeof data === 'string') return data.trim();
  if (typeof data.reply === 'string' && data.reply.trim()) return data.reply.trim();
  if (typeof data.response === 'string' && data.response.trim()) return data.response.trim();
  if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
  if (typeof data.content === 'string' && data.content.trim()) return data.content.trim();
  if (typeof data.text === 'string' && data.text.trim()) return data.text.trim();
  if (typeof data.answer === 'string' && data.answer.trim()) return data.answer.trim();
  if (typeof data.result === 'string' && data.result.trim()) return data.result.trim();
  if (typeof data.aiMessage === 'string' && data.aiMessage.trim()) return data.aiMessage.trim();

  if (data.aiMessage && typeof data.aiMessage === 'object') {
    if (typeof data.aiMessage.content === 'string' && data.aiMessage.content.trim()) {
      return data.aiMessage.content.trim();
    }
    if (typeof data.aiMessage.text === 'string' && data.aiMessage.text.trim()) {
      return data.aiMessage.text.trim();
    }
  }

  if (data.message && typeof data.message === 'object') {
    if (typeof data.message.content === 'string' && data.message.content.trim()) {
      return data.message.content.trim();
    }
    if (typeof data.message.text === 'string' && data.message.text.trim()) {
      return data.message.text.trim();
    }
  }

  if (Array.isArray(data.aiMessages) && data.aiMessages.length > 0) {
    const last = data.aiMessages[data.aiMessages.length - 1];
    if (typeof last === 'string') return last.trim();
    if (typeof last?.content === 'string' && last.content.trim()) return last.content.trim();
    if (typeof last?.text === 'string' && last.text.trim()) return last.text.trim();
  }

  if (data.data && typeof data.data === 'object') {
    const nested = extractReplyText(data.data);
    if (nested) return nested;
  }

  return '';
};

/**
 * Dispatches an authenticated POST request to the support API endpoints.
 */
export const sendSupportRequest = async (path, accessToken, body) => {
  const token = resolveAccessToken(accessToken);

  if (!token) {
    throw new Error('Please sign in to PetFriendly to chat with PFP Assistant AI.');
  }

  const response = await apiClient.post(path, body, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'fetch',
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

/**
 * Sends conversation messages to the PFP Assistant support chat API and returns the AI reply.
 */
export const askPfpAssistant = async (messages, accessToken) => {
  let messageList = [];
  let userText = '';

  if (typeof messages === 'string') {
    userText = messages.trim();
    messageList = [{ role: 'user', content: userText }];
  } else if (Array.isArray(messages)) {
    messageList = messages.map(m => {
      if (typeof m === 'string') {
        return { role: 'user', content: m.trim() };
      }
      return {
        role: m.role || (m.sender === 'user' ? 'user' : 'assistant'),
        content: m.content || m.text || '',
      };
    });

    const lastMsg = messageList[messageList.length - 1];
    userText = lastMsg?.content || '';
  }

  const payload = {
    message: userText,
    content: userText,
    query: userText,
    messages: messageList.slice(-12),
  };

  const data = await sendSupportRequest('/support/chat/message', accessToken, payload);

  const reply = extractReplyText(data);
  if (!reply) {
    throw new Error('The assistant returned an empty response.');
  }

  return reply;
};

/**
 * Submits the support chat transcript along with user resolution status.
 */
export const submitSupportTranscript = async (
  messages,
  accessToken,
  resolved = null,
  userDetails = {},
) => {
  const formattedMessages = Array.isArray(messages)
    ? messages.map(m => {
        if (typeof m === 'string') return { role: 'user', content: m };
        return {
          role: m.role || (m.sender === 'user' ? 'user' : 'assistant'),
          content: m.content || m.text || '',
        };
      })
    : [];

  return sendSupportRequest('/support/chat/transcript', accessToken, {
    messages: formattedMessages,
    resolved,
    userDetails,
  });
};
