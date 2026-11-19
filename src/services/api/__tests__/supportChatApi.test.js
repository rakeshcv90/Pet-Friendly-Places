import {
  resolveAccessToken,
  extractReplyText,
  sendSupportRequest,
  askPfpAssistant,
  submitSupportTranscript,
} from '../supportChatApi';
import apiClient from '../apiClient';
import { getItem, STORAGE_KEYS } from '../../storage/storage';
import { useStore } from '../../../store';

jest.mock('../apiClient', () => ({
  post: jest.fn(),
}));

jest.mock('../../storage/storage', () => ({
  getItem: jest.fn(),
  STORAGE_KEYS: { ACCESS_TOKEN: 'ACCESS_TOKEN' },
}));

jest.mock('../../../store', () => ({
  useStore: {
    getState: jest.fn(),
  },
}));

describe('supportChatApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveAccessToken', () => {
    it('returns explicit token when provided', () => {
      expect(resolveAccessToken('explicit-tok')).toBe('explicit-tok');
    });

    it('falls back to storage when explicit token is missing', () => {
      getItem.mockReturnValue('storage-tok');
      expect(resolveAccessToken(null)).toBe('storage-tok');
      expect(getItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
    });

    it('falls back to Zustand store when storage is empty', () => {
      getItem.mockReturnValue(null);
      useStore.getState.mockReturnValue({ token: 'store-tok' });
      expect(resolveAccessToken(null)).toBe('store-tok');
    });

    it('returns null when no token is available', () => {
      getItem.mockReturnValue(null);
      useStore.getState.mockReturnValue({ token: null });
      expect(resolveAccessToken(null)).toBeNull();
    });
  });

  describe('extractReplyText', () => {
    it('extracts raw string', () => {
      expect(extractReplyText('  Hello pet parent! ')).toBe('Hello pet parent!');
    });

    it('extracts reply property', () => {
      expect(extractReplyText({ reply: 'This is the reply' })).toBe('This is the reply');
    });

    it('extracts response property', () => {
      expect(extractReplyText({ response: 'This is the response' })).toBe('This is the response');
    });

    it('extracts message property as string', () => {
      expect(extractReplyText({ message: 'Message string' })).toBe('Message string');
    });

    it('extracts message property as object with content', () => {
      expect(extractReplyText({ message: { content: 'Content in message object' } })).toBe(
        'Content in message object'
      );
    });

    it('extracts aiMessage string or object', () => {
      expect(extractReplyText({ aiMessage: 'AI message text' })).toBe('AI message text');
      expect(extractReplyText({ aiMessage: { content: 'Nested AI content' } })).toBe(
        'Nested AI content'
      );
    });

    it('extracts aiMessages array', () => {
      expect(
        extractReplyText({
          aiMessages: [{ role: 'assistant', content: 'Last reply from array' }],
        })
      ).toBe('Last reply from array');
    });

    it('extracts nested data object', () => {
      expect(extractReplyText({ data: { reply: 'Deeply nested answer' } })).toBe(
        'Deeply nested answer'
      );
    });

    it('returns empty string for null or empty object', () => {
      expect(extractReplyText(null)).toBe('');
      expect(extractReplyText({})).toBe('');
    });
  });

  describe('sendSupportRequest', () => {
    it('throws error when no token is found', async () => {
      getItem.mockReturnValue(null);
      useStore.getState.mockReturnValue({ token: null });

      await expect(sendSupportRequest('/support/chat/message', null, {})).rejects.toThrow(
        'Please sign in to PetFriendly to chat with PFP Assistant AI.'
      );
    });

    it('attaches Bearer token in headers and returns response data', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: { reply: 'Server reply' },
      });

      const res = await sendSupportRequest('/support/chat/message', 'valid-token', {
        test: 1,
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/support/chat/message',
        { test: 1 },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'fetch',
            Authorization: 'Bearer valid-token',
          },
        }
      );
      expect(res).toEqual({ reply: 'Server reply' });
    });
  });

  describe('askPfpAssistant', () => {
    it('sends formatted messages and returns extracted reply', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: { reply: 'Verified dog stays near Bangalore include Palm Meadows.' },
      });

      const reply = await askPfpAssistant(
        [
          { sender: 'user', text: 'Stays near Bangalore?' },
        ],
        'auth-tok'
      );

      expect(reply).toBe('Verified dog stays near Bangalore include Palm Meadows.');
      expect(apiClient.post).toHaveBeenCalledWith(
        '/support/chat/message',
        expect.objectContaining({
          message: 'Stays near Bangalore?',
          content: 'Stays near Bangalore?',
          query: 'Stays near Bangalore?',
          messages: [{ role: 'user', content: 'Stays near Bangalore?' }],
        }),
        expect.any(Object)
      );
    });

    it('supports string input for messages parameter', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: { response: 'Direct string answer' },
      });

      const reply = await askPfpAssistant('Tell me about cat boarding', 'auth-tok');
      expect(reply).toBe('Direct string answer');
    });

    it('throws error when assistant returns empty response', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: {},
      });

      await expect(askPfpAssistant('Hello', 'auth-tok')).rejects.toThrow(
        'The assistant returned an empty response.'
      );
    });
  });

  describe('submitSupportTranscript', () => {
    it('submits transcript to /support/chat/transcript', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: { success: true },
      });

      const res = await submitSupportTranscript(
        [{ sender: 'user', text: 'Done' }],
        'auth-tok',
        true,
        { name: 'Alex' }
      );

      expect(res).toEqual({ success: true });
      expect(apiClient.post).toHaveBeenCalledWith(
        '/support/chat/transcript',
        {
          messages: [{ role: 'user', content: 'Done' }],
          resolved: true,
          userDetails: { name: 'Alex' },
        },
        expect.any(Object)
      );
    });
  });
});
