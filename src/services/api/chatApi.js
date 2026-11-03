import apiClient from './apiClient';

// 1. Check whether Tails Guide AI is enabled
export const getChatStatus = async () => {
  const response = await apiClient.get('/chat/ai-guide/status');
  return response.data;
};

// 2. Create a new chat session
export const createChatSession = async () => {
  const response = await apiClient.post('/chat/session', {});
  return response.data;
};

// 3. Select the chat persona
// Supported personas: pet_parent, place_owner
export const selectChatPersona = async (token, persona) => {
  if (!token) {
    throw new Error('Chat session token is missing.');
  }

  if (!['pet_parent', 'place_owner'].includes(persona)) {
    throw new Error('Please select a valid chat persona.');
  }

  const response = await apiClient.patch(`/chat/${encodeURIComponent(token)}/persona`, {
    persona,
    language: 'en',
  });

  return response.data;
};

// 4. Send a message to Tails Guide AI
export const postChatMessage = async (token, content, clientMessageId) => {
  if (!token) {
    throw new Error('Chat session token is missing.');
  }

  const trimmedContent = content?.trim();

  if (!trimmedContent) {
    throw new Error('Please enter a message.');
  }

  const response = await apiClient.post(`/chat/${encodeURIComponent(token)}/message`, {
    content: trimmedContent,
    clientMessageId: clientMessageId || createClientMessageId(),
  });

  return response.data;
};

// 5. Fetch existing chat messages
export const getChatMessages = async token => {
  if (!token) {
    throw new Error('Chat session token is missing.');
  }

  const response = await apiClient.get(`/chat/${encodeURIComponent(token)}/messages`);

  return response.data;
};

// 6. Generate a unique client-side message ID
// Use the same ID when retrying the same message.
export const createClientMessageId = () => {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};
