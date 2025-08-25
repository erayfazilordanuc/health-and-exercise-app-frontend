import {useState, useRef, useEffect} from 'react';
import {
  Animated,
  Modal,
  Platform,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {useTheme} from '../themes/ThemeProvider';

type ConsentModalProps = {
  visible: boolean;
  onApprove: () => void;
  onReject: () => void;
  onApproveText?: string;
  onRejectText?: string;
  body: React.ReactNode | string;
  /** En alta kaydırmadan onay butonu aktif olmasın */
  requireScrollToEnd?: boolean;
  /** Dışarıdan ekstra kilitlemek istersen */
  approveDisabled?: boolean;
  /** Onay kilitliyken göstereceğimiz küçük ipucu metni */
  approveHint?: string;
};

export const ConsentModal: React.FC<ConsentModalProps> = ({
  visible,
  onApprove,
  onReject,
  onApproveText,
  onRejectText,
  body,
  requireScrollToEnd = false,
  approveDisabled = false,
  approveHint = 'Lütfen metni sonuna kadar kaydırın.',
}) => {
  const {colors} = useTheme();
  const {height} = Dimensions.get('screen');

  // Modal’ı önce mount edip içerik ölçülünce fade-in
  const [mounted, setMounted] = useState<boolean>(false);
  const opacity = useRef(new Animated.Value(0)).current;

  // Kaydırma-kilit durumu
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // her açılışta sıfırla
      setScrolledToEnd(false);
      setScrollHeight(0);
      setContentHeight(0);
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }
  }, [visible, opacity]);

  const handleContentLayout = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleScroll = (e: any) => {
    const {layoutMeasurement, contentOffset, contentSize} = e.nativeEvent;
    const reached =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    if (reached) setScrolledToEnd(true);
  };

  const onScrollLayout = (e: any) => {
    setScrollHeight(e.nativeEvent.layout.height);
    // içerik kısa ise (kaydırma gerekmiyorsa) direkt onay aç
    if (contentHeight && e.nativeEvent.layout.height >= contentHeight) {
      setScrolledToEnd(true);
    }
  };

  const onScrollContentSizeChange = (_w: number, h: number) => {
    setContentHeight(h);
    // içerik kısa ise (kaydırma gerekmiyorsa) direkt onay aç
    if (scrollHeight && scrollHeight >= h) {
      setScrolledToEnd(true);
    }
  };

  const approveIsDisabled =
    approveDisabled || (requireScrollToEnd && !scrolledToEnd);

  if (!mounted) return null;

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      statusBarTranslucent={Platform.OS === 'android'}
      hardwareAccelerated
      onRequestClose={onReject}>
      <Animated.View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.4)',
          opacity,
        }}>
        <View
          onLayout={handleContentLayout}
          style={{
            width: '94%',
            maxHeight: height * 0.7,
            borderRadius: 24,
            padding: 20,
            backgroundColor: colors.background.primary,
          }}>
          <ScrollView
            style={{flexGrow: 1}}
            contentContainerStyle={{paddingBottom: 8}}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            onScroll={requireScrollToEnd ? handleScroll : undefined}
            onLayout={requireScrollToEnd ? onScrollLayout : undefined}
            onContentSizeChange={
              requireScrollToEnd ? onScrollContentSizeChange : undefined
            }
            scrollEventThrottle={16}>
            {typeof body === 'string' ? (
              <Text
                style={{
                  marginTop: 15,
                  fontSize: 13,
                  lineHeight: 20,
                  textAlign: 'center',
                  color: colors.text.primary,
                }}>
                {body}
              </Text>
            ) : (
              body
            )}
          </ScrollView>

          {/* Kilitliyken küçük ipucu */}
          {approveIsDisabled && (
            <Text
              style={{
                marginTop: 6,
                marginBottom: 2,
                fontSize: 12,
                textAlign: 'center',
                color: colors.text.third ?? 'gray',
              }}>
              {approveHint}
            </Text>
          )}

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 10,
            }}>
            <TouchableOpacity
              onPress={onReject}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: colors.background.secondary,
              }}>
              <Text style={{fontSize: 16, color: colors.text.primary}}>
                {onRejectText ?? 'Onaylamıyorum'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onApprove}
              disabled={approveIsDisabled}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: approveIsDisabled
                  ? colors.primary?.[100] ?? '#cfd8dc'
                  : colors.primary?.[200] ?? '#7AADFF',
              }}>
              <Text
                style={{
                  fontSize: 16,
                  color: '#fff',
                  opacity: approveIsDisabled ? 0.8 : 1,
                }}>
                {onApproveText ?? 'Onaylıyorum'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};
