import { BackNavButton } from '@/components/navigation/BackNavButton';
import { AppButton } from '@/components/ui/AppButton';
import { ScalePressable } from '@/components/ui/ScalePressable';
import { DesignTokens } from '@/constants/design-system';
import { getCharts } from '@/lib/api';
import { formatRating } from '@/lib/rating';
import { getFluidGridItemStyle, useResponsiveLayout } from '@/lib/responsive';
import type { ChartResponse } from '@/lib/types';
import { Link } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ChartsScreen() {
  const { isDesktop, isTablet, contentMaxWidth, horizontalPadding } = useResponsiveLayout();

  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');
  const [releaseType, setReleaseType] = useState('');
  const [result, setResult] = useState<ChartResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasFilters = useMemo(
    () => year.trim() !== '' || genre.trim() !== '' || releaseType.trim() !== '',
    [year, genre, releaseType]
  );
  const fluidCardItemStyle = getFluidGridItemStyle({
    isDesktop,
    isTablet,
    minWidth: 220,
    maxWidth: 320,
    nativeDesktopWidth: '49%',
    nativeTabletWidth: '48.5%',
    nativeMobileWidth: '100%',
  });

  const loadCharts = useCallback(async () => {
    if (loading) {
      return;
    }

    const trimmedYear = year.trim();
    if (trimmedYear !== '' && !/^\d+$/.test(trimmedYear)) {
      setError('Year must be a positive integer.');
      return;
    }

    const parsedYear = trimmedYear === '' ? undefined : Number(trimmedYear);

    setLoading(true);
    setError(null);

    try {
      const payload = await getCharts({
        year: parsedYear,
        genre: genre.trim() === '' ? undefined : genre.trim(),
        release_type: releaseType.trim() === '' ? undefined : releaseType.trim(),
        min_ratings: 1,
        limit: 50,
      });

      setResult(payload);
    } catch (chartsError) {
      setError(chartsError instanceof Error ? chartsError.message : 'Could not load charts.');
    } finally {
      setLoading(false);
    }
  }, [genre, loading, releaseType, year]);

  const resetFilters = useCallback(() => {
    setYear('');
    setGenre('');
    setReleaseType('');
    setResult(null);
    setError(null);
  }, []);

  const filterSummary = useMemo(() => {
    if (!result) {
      return 'Run a query to populate the ranking.';
    }

    const chips: string[] = [];
    if (result.filters.year !== null) {
      chips.push(String(result.filters.year));
    }
    if (result.filters.genre) {
      chips.push(result.filters.genre);
    }
    if (result.filters.release_type) {
      chips.push(result.filters.release_type);
    }

    return chips.length > 0 ? `Filtered by ${chips.join(' • ')}` : 'Showing all years and genres.';
  }, [result]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View>
          <BackNavButton />
          {Platform.OS === 'web' ? (
            <AppButton
              label={loading ? 'Loading…' : 'Run query'}
              variant="secondary"
              size="sm"
              onPress={loadCharts}
              loading={loading}
            />
          ) : null}
        </View>

        <View>
          <Text style={styles.heroEyebrow}>Charts</Text>
          <Text style={styles.heroTitle}>Find top-rated releases</Text>
          <Text style={styles.heroSubtitle}>
            Filter by year, genre, and release type to surface the records the community rates highest.
          </Text>
        </View>

        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Filters</Text>
            <Text style={styles.sectionMeta}>Use one field or combine all three.</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Year</Text>
              <TextInput
                value={year}
                onChangeText={setYear}
                placeholder="Optional year"
                placeholderTextColor={DesignTokens.colors.textMuted}
                accessibilityLabel="Year"
                keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'number-pad'}
                returnKeyType="search"
                onSubmitEditing={loadCharts}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Genre</Text>
              <TextInput
                value={genre}
                onChangeText={setGenre}
                placeholder="Optional genre"
                placeholderTextColor={DesignTokens.colors.textMuted}
                accessibilityLabel="Genre"
                returnKeyType="search"
                onSubmitEditing={loadCharts}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Release type</Text>
              <TextInput
                value={releaseType}
                onChangeText={setReleaseType}
                placeholder="Optional release type"
                placeholderTextColor={DesignTokens.colors.textMuted}
                accessibilityLabel="Release type"
                returnKeyType="search"
                onSubmitEditing={loadCharts}
                style={styles.input}
              />
            </View>

            <View style={styles.formActions}>
              <AppButton
                label={loading ? 'Loading…' : 'Load charts'}
                variant="primary"
                size="sm"
                onPress={loadCharts}
                loading={loading}
              />
              {hasFilters || result ? (
                <AppButton label="Reset filters" variant="secondary" size="sm" onPress={resetFilters} />
              ) : null}
            </View>
          </View>
        </View>

        {error ? (
          <View>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View>
            <Text style={styles.loadingTitle}>Loading chart data</Text>
            <Text style={styles.loadingText}>Crunching rankings with your selected filters.</Text>
          </View>
        ) : null}

        {!loading && !result ? (
          <View>
            <Text style={styles.emptyTitle}>No query run yet</Text>
            <Text style={styles.emptyText}>Set optional filters above, then load charts to see ranked albums.</Text>
          </View>
        ) : null}

        {result ? (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Results</Text>
              <Text style={styles.sectionMeta}>
                {result.items.length} entries • {filterSummary}
              </Text>
            </View>

            {result.items.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No chart entries found</Text>
                <Text style={styles.emptyText}>Try broadening your filters and run the query again.</Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {result.items.map((item, index) => (
                  <View
                    key={item.id}
                    style={fluidCardItemStyle}
                  >
                    <View style={styles.chartCard}>
                      <View style={styles.chartHeader}>
                        <View style={styles.rankBadge}>
                          <Text style={styles.rankBadgeText}>#{item.rank}</Text>
                        </View>
                        <Text style={styles.averageText}>Avg {formatRating(item.average_rating)}</Text>
                      </View>

                      <Text numberOfLines={2} style={styles.chartTitle}>
                        {item.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.chartArtist}>
                        {item.artist_name}
                      </Text>
                      <Text style={styles.chartMeta}>
                        {item.release_year} • {item.release_type}
                      </Text>
                      <Text numberOfLines={2} style={styles.chartGenres}>
                        Genres: {item.genres.length > 0 ? item.genres.join(', ') : 'n/a'}
                      </Text>

                      <View style={styles.statRow}>
                        <View style={styles.statPill}>
                          <Text style={styles.statLabel}>Ratings</Text>
                          <Text style={styles.statValue}>{item.ratings_count.toLocaleString()}</Text>
                        </View>
                        <View style={styles.statPill}>
                          <Text style={styles.statLabel}>Reviews</Text>
                          <Text style={styles.statValue}>{item.reviews_count.toLocaleString()}</Text>
                        </View>
                      </View>

                      <Link href={{ pathname: '/album/[id]', params: { id: String(item.id) } }} asChild>
                        <ScalePressable contentStyle={styles.inlineLinkCard} accessibilityRole="link">
                          <Text style={styles.inlineLinkText}>Open album</Text>
                        </ScalePressable>
                      </Link>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DesignTokens.colors.canvas,
  },
  container: {
    alignItems: 'center',
    paddingTop: DesignTokens.spacing.lg,
    paddingBottom: 96,
  },
  content: {
    width: '100%',
    gap: DesignTokens.spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  heroCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.lg,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.xl,
    gap: DesignTokens.spacing.sm,
  },
  heroEyebrow: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.micro,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h1,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    lineHeight: 21,
    maxWidth: 760,
  },
  section: {
    gap: DesignTokens.spacing.md,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h2,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  sectionMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
  },
  formCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.md,
  },
  fieldBlock: {
    gap: 6,
  },
  fieldLabel: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.sm,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 10,
    minHeight: 44,
    backgroundColor: DesignTokens.colors.surfaceMuted,
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.bodySmall,
  },
  formActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.xs,
  },
  errorBanner: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.dangerSurface,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.dangerSurface,
    padding: DesignTokens.spacing.md,
  },
  errorText: {
    color: DesignTokens.colors.dangerText,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '500',
  },
  loadingState: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.lg,
    gap: 5,
  },
  loadingTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '700',
  },
  loadingText: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.lg,
    gap: 6,
  },
  emptyTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '700',
  },
  emptyText: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
  },
  chartCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.xs,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  rankBadge: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.accentBlueSurface,
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: DesignTokens.colors.accentBlueSurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rankBadgeText: {
    color: DesignTokens.colors.accentBlueText,
    fontSize: DesignTokens.typography.micro,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontVariant: ['tabular-nums'],
  },
  averageText: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  chartTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '700',
    lineHeight: 22,
  },
  chartArtist: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '600',
  },
  chartMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
  },
  chartGenres: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
    lineHeight: 18,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.xs,
    marginTop: DesignTokens.spacing.xs,
  },
  statPill: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surfaceMuted,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 8,
    minWidth: 106,
    gap: 2,
  },
  statLabel: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.micro,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statValue: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  inlineLinkCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: DesignTokens.colors.surfaceMuted,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    marginTop: DesignTokens.spacing.xs,
  },
  inlineLinkText: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
  },
});
