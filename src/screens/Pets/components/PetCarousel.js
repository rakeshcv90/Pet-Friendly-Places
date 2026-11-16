import React, { useRef } from 'react';
import { View, Text, Animated, Dimensions, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { PetCard } from './PetCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// About two cards fit on screen, with the next one peeking in
const GAP = s(8);
const ITEM_WIDTH = Math.floor((SCREEN_WIDTH - s(16) - GAP) / 1.95);
const SNAP = ITEM_WIDTH + GAP;

// The pets, swiped sideways. Cards turn in 3D as they move off-centre, and the last slide adds a pet.
export const PetCarousel = ({
  pets,
  isDarkMode,
  onOpen,
  onHealth,
  onPawsport,
  onEdit,
  onAddPet,
}) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const data = [...pets, { id: '__add__', isAdd: true }];

  const renderItem = ({ item, index }) => {
    const range = [(index - 1) * SNAP, index * SNAP, (index + 1) * SNAP];
    const style = {
      opacity: scrollX.interpolate({
        inputRange: range,
        outputRange: [0.75, 1, 0.75],
        extrapolate: 'clamp',
      }),
      transform: [
        { perspective: 900 },
        {
          scale: scrollX.interpolate({
            inputRange: range,
            outputRange: [0.96, 1, 0.96],
            extrapolate: 'clamp',
          }),
        },
        {
          rotateY: scrollX.interpolate({
            inputRange: range,
            outputRange: ['14deg', '0deg', '-14deg'],
            extrapolate: 'clamp',
          }),
        },
      ],
    };

    return (
      <Animated.View style={[styles.item, style]}>
        {item.isAdd ? (
          <BouncyPressable
            testID="my-pets-add"
            style={[styles.add, isDarkMode && styles.addDark]}
            activeScale={0.96}
            onPress={onAddPet}>
            <View style={styles.addIcon}>
              <Feather name="plus" size={ms(22)} color="#FFFFFF" />
            </View>
            <Text style={[styles.addTitle, isDarkMode && styles.textWhite]}>Add a pet</Text>
            <Text style={[styles.addSub, isDarkMode && styles.mutedDark]}>
              Create another pawsport
            </Text>
          </BouncyPressable>
        ) : (
          <PetCard
            pet={item}
            onOpen={() => onOpen(item)}
            onHealth={() => onHealth(item)}
            onPawsport={() => onPawsport(item)}
            onEdit={() => onEdit(item)}
          />
        )}
      </Animated.View>
    );
  };

  return (
    <View>
      <Animated.FlatList
        testID="my-pets-carousel"
        data={data}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentContainerStyle={styles.list}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: true,
        })}
      />
      <View style={styles.dots}>
        {data.map((item, index) => {
          const range = [(index - 1) * SNAP, index * SNAP, (index + 1) * SNAP];
          return (
            <View key={item.id} style={[styles.dot, isDarkMode && styles.dotDark]}>
              {/* Active marker: only opacity and scale, which the native driver supports */}
              <Animated.View
                style={[
                  styles.dotActive,
                  {
                    opacity: scrollX.interpolate({
                      inputRange: range,
                      outputRange: [0, 1, 0],
                      extrapolate: 'clamp',
                    }),
                    transform: [
                      {
                        scaleX: scrollX.interpolate({
                          inputRange: range,
                          outputRange: [1, 3.2, 1],
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  list: { paddingHorizontal: s(16), paddingTop: vs(4), paddingBottom: vs(6) },
  item: { width: ITEM_WIDTH, marginRight: GAP },
  add: {
    flex: 1,
    minHeight: vs(150),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: s(24),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#A78BFA',
    backgroundColor: '#F5F3FF',
  },
  addDark: { backgroundColor: '#1A0B30', borderColor: '#4C1D95' },
  addIcon: {
    width: s(46),
    height: s(46),
    borderRadius: s(23),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    borderBottomWidth: 3,
    borderBottomColor: '#4C1D95',
  },
  addTitle: {
    marginTop: vs(10),
    fontSize: s(15),
    color: '#3B108F',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  addSub: {
    marginTop: vs(2),
    fontSize: s(11.5),
    color: '#7C3AED',
    fontFamily: theme.typography.fontFamily.medium,
  },
  textWhite: { color: '#FFFFFF' },
  mutedDark: { color: '#A78BFA' },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(8),
  },
  dot: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
    marginHorizontal: s(8),
    backgroundColor: '#DDD6FE',
  },
  dotDark: { backgroundColor: '#3B1F66' },
  dotActive: { ...StyleSheet.absoluteFillObject, borderRadius: s(3), backgroundColor: '#7C3AED' },
});
