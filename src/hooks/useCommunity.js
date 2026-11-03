import { useMemo, useState } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api/apiClient';
import { API_ENDPOINTS, API_BASE_URL } from '../services/api/apiList';
import { getItem, setItem, STORAGE_KEYS } from '../services/storage/storage';
import { useStore } from '../store';

// Directory of active communities (topics and cities)
export const useCommunities = (options = {}) => {
  return useQuery({
    queryKey: ['community', 'list'],
    queryFn: async () => {
      const data = await api.get(API_ENDPOINTS.COMMUNITY.LIST);
      return Array.isArray(data?.communities) ? data.communities : [];
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

// Posts of one community, 20 per page
export const useCommunityPosts = (communitySlug, options = {}) => {
  return useInfiniteQuery({
    queryKey: ['community', 'posts', communitySlug],
    enabled: !!communitySlug,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.get(API_ENDPOINTS.COMMUNITY.POSTS, {
        params: { community: communitySlug, page: pageParam },
      }),
    getNextPageParam: lastPage => {
      const posts = lastPage?.posts || [];
      const limit = lastPage?.limit || 20;
      return posts.length >= limit ? (lastPage?.page || 1) + 1 : undefined;
    },
    staleTime: 1000 * 60 * 2,
    ...options,
  });
};

// One post with its replies
export const useCommunityPost = (postSlug, options = {}) => {
  return useQuery({
    queryKey: ['community', 'post', postSlug],
    enabled: !!postSlug,
    queryFn: () => api.get(API_ENDPOINTS.COMMUNITY.POST_DETAIL(postSlug)),
    staleTime: 1000 * 60 * 2,
    ...options,
  });
};

// Picks a real thread to feature: the most-upvoted post of the busiest community,
// plus its top-level replies (accepted first, then most upvoted)
export const useFeaturedThread = communities => {
  const community = useMemo(
    () => [...(communities || [])].sort((a, b) => (b.postCount || 0) - (a.postCount || 0))[0],
    [communities],
  );
  const postsQuery = useCommunityPosts(community?.slug);
  const post = useMemo(() => {
    const posts = postsQuery.data?.pages?.[0]?.posts || [];
    return posts.reduce(
      (best, item) => (!best || item.upvoteCount > best.upvoteCount ? item : best),
      null,
    );
  }, [postsQuery.data]);
  const detailQuery = useCommunityPost(post?.slug);
  const replies = useMemo(
    () =>
      (detailQuery.data?.replies || [])
        .filter(reply => !reply.parentReplyId)
        .sort(
          (a, b) => Number(b.isAccepted) - Number(a.isAccepted) || b.upvoteCount - a.upvoteCount,
        )
        .slice(0, 2),
    [detailQuery.data],
  );

  return { community, post, body: detailQuery.data?.post?.body, replies };
};

const readMemberships = () => getItem(STORAGE_KEYS.COMMUNITY_MEMBERSHIPS, true) || {};

// Join / leave a community. The API only exposes a toggle (POST /community/memberships) and no way
// to read membership, so the last known state is remembered on the device per signed-in user.
// Exactly one request is sent per toggle, and its `joined` value is the source of truth.
export const useCommunityMembership = communitySlug => {
  const queryClient = useQueryClient();
  const user = useStore(state => state.user);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const storageKey = `${user?.id ?? user?.email ?? 'anon'}:${communitySlug}`;
  const [isMember, setIsMember] = useState(() => !!readMemberships()[storageKey]);

  const mutation = useMutation({
    mutationFn: () => api.post(API_ENDPOINTS.COMMUNITY.MEMBERSHIPS, { communitySlug }),
    onSuccess: data => {
      const joined = !!data?.joined;
      setIsMember(joined);
      setItem(STORAGE_KEYS.COMMUNITY_MEMBERSHIPS, { ...readMemberships(), [storageKey]: joined });
      // Member counts changed
      queryClient.invalidateQueries({ queryKey: ['community', 'list'] });
    },
  });

  return {
    isMember,
    isAuthenticated,
    isPending: mutation.isPending,
    toggle: () => mutation.mutateAsync(),
  };
};

// Creates a post. New posts are moderated, so they do not appear in the lists straight away.
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payload => api.post(API_ENDPOINTS.COMMUNITY.POSTS, payload),
    onSuccess: (data, payload) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts', payload.communitySlug] });
      queryClient.invalidateQueries({ queryKey: ['community', 'list'] });
    },
  });
};

// Posts a reply to a thread, or to another reply when `parentReplyId` is given. Takes the reply
// text, or { body, parentReplyId }. Replies are moderated, so they do not appear straight away.
export const useCreateReply = postSlug => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async input => {
      const payload = typeof input === 'string' ? { body: input } : input;
      const url = API_ENDPOINTS.COMMUNITY.POST_REPLIES(postSlug);
      if (__DEV__) {
        console.log(`[community] POST ${API_BASE_URL}${url}`, payload);
      }
      try {
        const data = await api.post(url, payload);
        if (__DEV__) {
          console.log('[community] reply saved, server response:', data);
        }
        return data;
      } catch (e) {
        if (__DEV__) {
          console.log(
            '[community] reply FAILED',
            e?.response?.status,
            e?.response?.data ?? e?.message,
          );
        }
        throw e;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'post', postSlug] });
    },
  });
};

// Marks a reply as the accepted answer of a question (only the asker is allowed to, the server decides)
export const useAcceptReply = postSlug => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: replyId => api.post(API_ENDPOINTS.COMMUNITY.POST_ACCEPT(postSlug), { replyId }),
    onSuccess: (_data, replyId) => {
      // Show the accepted answer straight away, then refresh from the server
      queryClient.setQueryData(['community', 'post', postSlug], current =>
        current
          ? {
              ...current,
              post: { ...current.post, acceptedReplyId: replyId },
              replies: (current.replies || []).map(reply => ({
                ...reply,
                isAccepted: reply.id === replyId,
              })),
            }
          : current,
      );
      queryClient.invalidateQueries({ queryKey: ['community', 'post', postSlug] });
    },
  });
};

// Reports a post or reply to the moderators
export const useReportContent = () =>
  useMutation({
    mutationFn: ({ targetType, targetId, reason }) =>
      api.post(API_ENDPOINTS.COMMUNITY.REPORTS, { targetType, targetId, reason }),
  });

// Attaches one photo to a created post or reply. Resolves to false instead of throwing, so a failed
// photo never hides that the post itself was saved. Sent with fetch and no manual Content-Type, so
// the multipart boundary is added automatically.
const uploadMedia = async (targetType, targetId, photo) => {
  try {
    const form = new FormData();
    form.append('file', {
      uri: photo.uri,
      name: photo.fileName ?? 'photo.jpg',
      type: photo.type ?? 'image/jpeg',
    });
    form.append('targetType', targetType);
    form.append('targetId', String(targetId));

    const token = getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COMMUNITY.MEDIA_UPLOAD}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    return response.ok;
  } catch (e) {
    return false;
  }
};

export const uploadPostPhoto = (postId, photo) => uploadMedia('post', postId, photo);
export const uploadReplyPhoto = (replyId, photo) => uploadMedia('reply', replyId, photo);
