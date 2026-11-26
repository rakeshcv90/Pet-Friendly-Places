import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';
import { SectionCard, Pill, FactRow } from './SectionCard';
import { styles } from './styles';

const RULES_PREVIEW = 4;

const ChipGroup = ({ title, items, icon, background, color, palette }) =>
  items.length ? (
    <>
      <Text style={[styles.subHeading, { color: palette.muted }]}>{title}</Text>
      <View style={styles.chipsWrap}>
        {items.map(label => (
          <Pill key={label} label={label} icon={icon} background={background} color={color} />
        ))}
      </View>
    </>
  ) : null;

/** The structured pet policy: key rules, charges, leash, who and where, and the full details. */
export const ListingPetPolicy = ({ listing, palette, isDarkMode }) => {
  const [showAllRules, setShowAllRules] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const { policy, bestFor, bestForNotes } = listing;

  const rows = [
    policy.charges && ['wallet-outline', 'Pet charges', policy.charges],
    policy.offLeash && ['walk-outline', 'Off-leash use permitted', policy.offLeash],
    policy.leashRules && ['link-outline', 'Leash rules', policy.leashRules],
    policy.access && ['leaf-outline', 'Outdoor access', policy.access],
  ].filter(Boolean);

  const hasAnything =
    policy.keyRules.length ||
    rows.length ||
    policy.allowedPets.length ||
    policy.dogSizes.length ||
    policy.allowedIn.length ||
    policy.amenities.length ||
    bestFor.length;
  if (!hasAnything) {
    return null;
  }

  const rules = showAllRules ? policy.keyRules : policy.keyRules.slice(0, RULES_PREVIEW);
  const hasFullDetails =
    policy.keyRules.length > 0 || policy.feeBasis || policy.reviewMethod || policy.reviewDate;

  return (
    <SectionCard
      title="Pet policy"
      icon="document-text-outline"
      palette={palette}
      isDarkMode={isDarkMode}>
      {rules.length ? (
        <>
          <Text style={[styles.subHeading, styles.firstSubHeading, { color: palette.muted }]}>
            KEY RULES
          </Text>
          {rules.map(rule => (
            <View key={rule} style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={ms(15)} color={palette.good} />
              <Text style={[styles.bulletText, { color: palette.body }]}>{rule}</Text>
            </View>
          ))}
          {policy.keyRules.length > RULES_PREVIEW ? (
            <TouchableOpacity onPress={() => setShowAllRules(v => !v)} activeOpacity={0.7}>
              <Text style={[styles.readMore, { color: palette.accent }]}>
                {showAllRules ? 'Show fewer rules' : `Show all ${policy.keyRules.length} rules`}
              </Text>
            </TouchableOpacity>
          ) : null}
        </>
      ) : null}

      {rows.length ? (
        <>
          <Text style={[styles.subHeading, { color: palette.muted }]}>AT A GLANCE</Text>
          {rows.map(([icon, label, value], i) => (
            <FactRow
              key={label}
              icon={icon}
              label={label}
              value={value}
              palette={palette}
              first={i === 0}
            />
          ))}
        </>
      ) : null}

      <ChipGroup
        title="ALLOWED PETS"
        items={policy.allowedPets}
        icon="paw"
        background={palette.soft}
        color={palette.accent}
        palette={palette}
      />
      <ChipGroup
        title="DOG SIZES"
        items={policy.dogSizes}
        icon="resize-outline"
        background={palette.soft}
        color={palette.accent}
        palette={palette}
      />
      <ChipGroup
        title="PETS ALLOWED IN"
        items={policy.allowedIn}
        icon="checkmark-circle"
        background={palette.goodSoft}
        color={palette.good}
        palette={palette}
      />
      <ChipGroup
        title="PET AMENITIES"
        items={policy.amenities}
        icon="star"
        background={palette.warnSoft}
        color={palette.warn}
        palette={palette}
      />
      <ChipGroup
        title="BEST FOR"
        items={bestFor}
        icon="checkmark"
        background={palette.goodSoft}
        color={palette.good}
        palette={palette}
      />

      {bestForNotes.length ? (
        <View style={styles.notesBox}>
          {bestForNotes.map(note => (
            <View key={note} style={styles.bulletRow}>
              <Ionicons name="sparkles-outline" size={ms(14)} color={palette.accent} />
              <Text style={[styles.bulletText, { color: palette.body }]}>{note}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {hasFullDetails ? (
        <>
          <TouchableOpacity
            testID="listing-full-policy-toggle"
            activeOpacity={0.8}
            onPress={() => setShowFull(v => !v)}
            style={[styles.toggleRow, { backgroundColor: palette.soft }]}>
            <Text style={[styles.toggleText, { color: palette.accent }]}>
              Full pet policy, fee history and review details
            </Text>
            <Ionicons
              name={showFull ? 'chevron-up' : 'chevron-down'}
              size={ms(18)}
              color={palette.accent}
            />
          </TouchableOpacity>
          {showFull ? (
            <View>
              {policy.keyRules.length ? (
                <>
                  <Text style={[styles.subHeading, { color: palette.muted }]}>FULL PET POLICY</Text>
                  <Text style={[styles.bodyText, { color: palette.body }]}>
                    {policy.keyRules.join(' ')}
                  </Text>
                </>
              ) : null}
              {policy.charges || policy.feeBasis ? (
                <>
                  <Text style={[styles.subHeading, { color: palette.muted }]}>
                    FEE HISTORY AND SOURCE NOTES
                  </Text>
                  {policy.charges ? (
                    <Text style={[styles.bodyText, { color: palette.body }]}>
                      Additional fee notes: {policy.charges}
                    </Text>
                  ) : null}
                  {policy.feeBasis ? (
                    <Text style={[styles.bodyText, { color: palette.body }]}>
                      Recorded fee basis: {policy.feeBasis}
                    </Text>
                  ) : null}
                </>
              ) : null}
              {policy.reviewMethod || policy.reviewDate ? (
                <>
                  <Text style={[styles.subHeading, { color: palette.muted }]}>REVIEW DETAILS</Text>
                  {policy.reviewMethod ? (
                    <Text style={[styles.bodyText, { color: palette.body }]}>
                      Review method: {policy.reviewMethod}.
                    </Text>
                  ) : null}
                  {policy.reviewDate ? (
                    <Text style={[styles.bodyText, { color: palette.body }]}>
                      Review date: {policy.reviewDate}
                    </Text>
                  ) : null}
                </>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}
    </SectionCard>
  );
};
