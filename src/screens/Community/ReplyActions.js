import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { s } from 'react-native-size-matters';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { theme } from '../../theme';
import { useCreateReply, useReportContent } from '../../hooks/useCommunity';

const PURPLE = '#7B2CFF';
const PINK = '#FF4FB8';
const TEAL = '#2DB5A0';
const DEEP_PURPLE = '#3B108F';
// Limits enforced by the API
const INLINE_MIN = 10;
const INLINE_MAX = 10000;
const REPORT_MIN = 5;
const REPORT_MAX = 500;

const { fontFamily } = theme.typography;

// Accept / Reply / Report row under a reply. `onAccept` and `onReply` are omitted when not allowed.
export const ReplyActionBar = ({ onAccept, accepting, onReply, onReport }) => (
  <View style={styles.bar}>
    {onAccept ? (
      <BouncyPressable
        activeScale={0.94}
        disabled={accepting}
        onPress={onAccept}
        accessibilityLabel="Accept answer"
        style={styles.acceptBtn}>
        {accepting ? (
          <ActivityIndicator size="small" color={TEAL} />
        ) : (
          <Text style={styles.acceptText}>✓ Accept</Text>
        )}
      </BouncyPressable>
    ) : null}
    {onReply ? (
      <Pressable
        onPress={onReply}
        accessibilityRole="button"
        accessibilityLabel="Reply"
        hitSlop={6}
        style={styles.replyBtn}>
        <Text style={styles.replyText}>💬 Reply</Text>
      </Pressable>
    ) : null}
    <Pressable
      onPress={onReport}
      accessibilityRole="button"
      accessibilityLabel="Report"
      hitSlop={6}>
      <Text style={styles.reportText}>Report</Text>
    </Pressable>
  </View>
);

// Reply box shown under a reply, replying to that reply
export const InlineReplyForm = ({ slug, parentReplyId, onCancel, onSubmitted, isDarkMode }) => {
  const createReply = useCreateReply(slug);
  const [body, setBody] = useState('');
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  // Once sent, the confirmation stays for a moment, then the box closes and the pending reply remains
  useEffect(() => {
    if (!sent) {
      return undefined;
    }
    const timer = setTimeout(onCancel, 3000);
    return () => clearTimeout(timer);
  }, [sent, onCancel]);

  const trimmed = body.trim();
  const canSubmit = trimmed.length >= INLINE_MIN && !createReply.isPending;

  const submit = async () => {
    if (!canSubmit) {
      return;
    }
    setError(null);
    try {
      const data = await createReply.mutateAsync({ body: trimmed, parentReplyId });
      if (!data || data.error || typeof data.id !== 'number') {
        setError(data?.error ?? 'The reply could not be confirmed. Please try again.');
        return;
      }
      onSubmitted?.({ id: data.id, status: data.status, body: trimmed, parentReplyId });
      setSent(true);
    } catch (e) {
      setError(e?.response?.data?.error ?? 'The reply could not be confirmed. Please try again.');
    }
  };

  if (sent) {
    return (
      <View style={styles.sent}>
        <Text style={styles.sentText}>✓ Reply submitted, it will appear after review. 🐾</Text>
        <Text style={styles.sentHint}>
          Your reply is shown below as pending until a moderator approves it.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.form, isDarkMode && styles.formDark]}>
      <Text style={[styles.label, isDarkMode && styles.textLight]}>Your reply</Text>
      <TextInput
        value={body}
        onChangeText={setBody}
        multiline
        autoFocus
        maxLength={INLINE_MAX}
        textAlignVertical="top"
        placeholder="Write a reply… (supports **bold**, _italic_)"
        placeholderTextColor="#9A8BA9"
        accessibilityLabel="Your reply"
        style={[styles.input, isDarkMode && styles.inputDark]}
      />
      <Text style={styles.rules}>
        Replies are reviewed before going live. Medical advice needs a vet source. Undisclosed
        promotion is removed.
      </Text>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <View style={styles.formButtons}>
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <BouncyPressable onPress={submit} disabled={!canSubmit} accessibilityLabel="Post reply">
          <LinearGradient
            colors={canSubmit ? [PURPLE, PINK] : ['#E5E7EB', '#E5E7EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.postBtn}>
            <Text style={[styles.postText, !canSubmit && styles.postTextDisabled]}>
              {createReply.isPending ? 'Posting…' : 'Post reply'}
            </Text>
          </LinearGradient>
        </BouncyPressable>
      </View>
    </View>
  );
};

// Centered popup asking why a post or reply is being reported
export const ReportModal = ({ target, onClose }) => {
  const report = useReportContent();
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const trimmed = reason.trim();
  const canSubmit = trimmed.length >= REPORT_MIN && !report.isPending;

  const close = () => {
    setReason('');
    setError(null);
    setDone(false);
    onClose();
  };

  const submit = async () => {
    if (!canSubmit) {
      return;
    }
    setError(null);
    try {
      const data = await report.mutateAsync({
        targetType: target.type === 'post' ? 'post' : 'reply',
        targetId: target.id,
        reason: trimmed,
      });
      if (data?.error) {
        setError(data.error);
        return;
      }
      setDone(true);
    } catch (e) {
      setError(e?.response?.data?.error ?? 'Could not confirm your report. Please try again.');
    }
  };

  return (
    <Modal
      visible={!!target}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityLabel="Close report"
        />
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>🚩 Report {target?.type}</Text>
          {done ? (
            <View>
              <Text style={styles.doneText}>
                ✓ Report submitted. Thank you for helping keep Tails Community safe. 🐾
              </Text>
              <BouncyPressable onPress={close} accessibilityLabel="Close">
                <LinearGradient
                  colors={[PURPLE, PINK]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.closeBtn}>
                  <Text style={styles.closeText}>Close</Text>
                </LinearGradient>
              </BouncyPressable>
            </View>
          ) : (
            <>
              <Text style={styles.dialogDesc}>
                Please briefly describe why you are reporting this content.
              </Text>
              <Text style={styles.label}>Reason for report</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                multiline
                maxLength={REPORT_MAX}
                textAlignVertical="top"
                placeholder="e.g. Spam, misleading information, inappropriate content…"
                placeholderTextColor="#9CA3AF"
                accessibilityLabel="Reason for report"
                style={styles.reportInput}
              />
              <Text style={styles.reportHint}>At least {REPORT_MIN} characters.</Text>
              {error ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
              ) : null}
              <View style={styles.dialogButtons}>
                <Pressable
                  onPress={close}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  style={[styles.dialogBtn, styles.dialogCancel]}>
                  <Text style={styles.dialogCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={submit}
                  disabled={!canSubmit}
                  accessibilityRole="button"
                  accessibilityLabel="Submit report"
                  style={[
                    styles.dialogBtn,
                    styles.dialogReport,
                    !canSubmit && styles.dialogReportDisabled,
                  ]}>
                  <Text style={styles.dialogReportText}>
                    {report.isPending ? 'Submitting…' : 'Report'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  textLight: { color: '#FFFFFF' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: s(10),
    paddingTop: s(8),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4DDF3',
  },
  acceptBtn: {
    minWidth: s(64),
    alignItems: 'center',
    backgroundColor: '#E6FBF8',
    borderColor: TEAL,
    borderWidth: 1.5,
    borderRadius: s(16),
    paddingHorizontal: s(12),
    paddingVertical: s(4),
  },
  acceptText: { fontFamily: fontFamily.extraBold, fontSize: s(11), color: TEAL },
  replyBtn: { paddingHorizontal: s(4), paddingVertical: s(4) },
  replyText: { fontFamily: fontFamily.extraBold, fontSize: s(11.5), color: PURPLE },
  reportText: {
    fontFamily: fontFamily.medium,
    fontSize: s(10.5),
    color: '#9A8BA9',
    textDecorationLine: 'underline',
  },

  form: {
    marginTop: s(8),
    padding: s(13),
    backgroundColor: '#F8F5FF',
    borderRadius: s(16),
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
  },
  formDark: { backgroundColor: '#170A2E', borderColor: '#2E1654' },
  label: {
    fontFamily: fontFamily.extraBold,
    fontSize: s(11.5),
    color: DEEP_PURPLE,
    marginBottom: s(6),
  },
  input: {
    minHeight: s(80),
    maxHeight: s(160),
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderRadius: s(12),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: s(12),
    paddingVertical: s(9),
    fontFamily: fontFamily.regular,
    fontSize: s(12.5),
    lineHeight: s(18),
    color: '#1C1C1C',
  },
  inputDark: { backgroundColor: '#1E0E38', borderColor: '#2E1654', color: '#FFFFFF' },
  rules: {
    fontFamily: fontFamily.medium,
    fontSize: s(10),
    lineHeight: s(14),
    color: '#7B6FA0',
    marginTop: s(8),
  },
  error: { fontFamily: fontFamily.semiBold, fontSize: s(11), color: '#B91C1C', marginTop: s(8) },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: s(8),
    marginTop: s(12),
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderRadius: s(20),
    paddingHorizontal: s(16),
    paddingVertical: s(7),
  },
  cancelText: { fontFamily: fontFamily.bold, fontSize: s(11.5), color: '#6B7280' },
  postBtn: { borderRadius: s(20), paddingHorizontal: s(20), paddingVertical: s(8) },
  postText: { fontFamily: fontFamily.extraBold, fontSize: s(11.5), color: '#FFFFFF' },
  postTextDisabled: { color: '#9CA3AF' },
  sent: {
    marginTop: s(8),
    backgroundColor: '#E6FBF8',
    borderColor: TEAL,
    borderWidth: 1,
    borderRadius: s(12),
    padding: s(12),
  },
  sentHint: {
    fontFamily: fontFamily.medium,
    fontSize: s(10.5),
    lineHeight: s(15),
    color: '#0F766E',
    marginTop: s(4),
  },
  sentText: { fontFamily: fontFamily.bold, fontSize: s(12), color: '#065F46' },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: s(16),
  },
  dialog: {
    width: '100%',
    maxWidth: s(360),
    backgroundColor: '#FFFFFF',
    borderRadius: s(22),
    padding: s(22),
  },
  dialogTitle: {
    fontFamily: fontFamily.extraBold,
    fontSize: s(16),
    color: '#1B1535',
    marginBottom: s(6),
  },
  dialogDesc: {
    fontFamily: fontFamily.regular,
    fontSize: s(12.5),
    lineHeight: s(18),
    color: '#6B7280',
    marginBottom: s(14),
  },
  reportInput: {
    minHeight: s(96),
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderRadius: s(12),
    paddingHorizontal: s(12),
    paddingVertical: s(10),
    fontFamily: fontFamily.regular,
    fontSize: s(12.5),
    lineHeight: s(18),
    color: '#1C1C1C',
  },
  reportHint: { fontFamily: fontFamily.medium, fontSize: s(10), color: '#9A8BA9', marginTop: s(6) },
  dialogButtons: { flexDirection: 'row', gap: s(10), marginTop: s(14) },
  dialogBtn: { flex: 1, alignItems: 'center', borderRadius: s(24), paddingVertical: s(12) },
  dialogCancel: { backgroundColor: '#F3F4F6' },
  dialogCancelText: { fontFamily: fontFamily.bold, fontSize: s(13), color: '#374151' },
  dialogReport: { backgroundColor: '#EF4444' },
  dialogReportDisabled: { opacity: 0.5 },
  dialogReportText: { fontFamily: fontFamily.extraBold, fontSize: s(13), color: '#FFFFFF' },
  doneText: {
    fontFamily: fontFamily.semiBold,
    fontSize: s(12.5),
    lineHeight: s(19),
    color: '#065F46',
    marginTop: s(8),
    marginBottom: s(18),
  },
  closeBtn: { borderRadius: s(24), paddingVertical: s(12), alignItems: 'center' },
  closeText: { fontFamily: fontFamily.extraBold, fontSize: s(13), color: '#FFFFFF' },
});
