import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TextField } from '../components/ui/TextField';
import { LoadingPlaceholder } from '../components/LoadingPlaceholder';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import type { ProfileStackParamList } from '../navigation/RootNavigator';
import { getSavedLocations, removeSavedLocation, saveLocation, type SavedLocation } from '../services/locationService';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'> & { onLogout: () => void };

export function ProfileScreen({ navigation, onLogout }: Props) {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [label, setLabel] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setLocations(await getSavedLocations()); } catch (error) { Alert.alert('Locations unavailable', error instanceof Error ? error.message : 'Please try again.'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const addLocation = async () => {
    const lat = Number(latitude); const lon = Number(longitude);
    if (!label.trim() || !Number.isFinite(lat) || !Number.isFinite(lon)) { Alert.alert('Check location', 'Enter a name, latitude, and longitude.'); return; }
    try { await saveLocation({ label: label.trim(), latitude: lat, longitude: lon, timezone: 'UTC', is_default: locations.length === 0 }); setLabel(''); setLatitude(''); setLongitude(''); await load(); }
    catch (error) { Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.'); }
  };
  const remove = async (id: string | number) => { try { await removeSavedLocation(id); await load(); } catch (error) { Alert.alert('Could not remove', error instanceof Error ? error.message : 'Please try again.'); } };

  return (
    <ScreenContainer scrollable>
      <Text style={styles.heading}>Your weather setup</Text>
      <Text style={styles.copy}>Save the places you check most often, then jump into plant care or ask the weather assistant.</Text>
      <Text style={styles.section}>Saved locations</Text>
      {loading ? <LoadingPlaceholder message="Loading saved locations..." /> : null}
      {!loading && locations.length === 0 ? <Text style={styles.empty}>No saved locations yet.</Text> : null}
      {locations.map((location) => <Card key={location.id} style={styles.location}><View style={styles.locationText}><Text style={styles.locationName}>{location.label}</Text><Text style={styles.coords}>{Number(location.latitude).toFixed(3)}, {Number(location.longitude).toFixed(3)}</Text></View><Button label="Remove" variant="ghost" onPress={() => void remove(location.id)} style={styles.remove} /></Card>)}
      <Card style={styles.form}><Text style={styles.formTitle}>Add a location</Text><TextField label="Location name" value={label} onChangeText={setLabel} placeholder="Home or University" /><TextField label="Latitude" value={latitude} onChangeText={setLatitude} keyboardType="decimal-pad" placeholder="6.9271" /><TextField label="Longitude" value={longitude} onChangeText={setLongitude} keyboardType="decimal-pad" placeholder="79.8612" /><Button label="Save location" onPress={() => void addLocation()} /></Card>
      <View style={styles.actions}><Button label="Plant care" onPress={() => navigation.navigate('Plants')} /><Button label="Ask WeatherWise" variant="secondary" onPress={() => navigation.navigate('Assistant')} /><Button label="Log out" variant="danger" onPress={onLogout} /></View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.xxl, fontWeight: TYPOGRAPHY.fontWeight.bold, marginTop: SPACING.m },
  copy: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.m, lineHeight: 22, marginTop: SPACING.s },
  section: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.l, fontWeight: TYPOGRAPHY.fontWeight.semiBold, marginTop: SPACING.l, marginBottom: SPACING.s },
  empty: { color: COLORS.textSecondary, marginBottom: SPACING.m },
  location: { flexDirection: 'row', alignItems: 'center' },
  locationText: { flex: 1 }, locationName: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold }, coords: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, marginTop: 2 },
  remove: { minHeight: 36, paddingVertical: SPACING.s, paddingHorizontal: SPACING.s },
  form: { marginTop: SPACING.m }, formTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold, marginBottom: SPACING.m },
  actions: { gap: SPACING.s, marginTop: SPACING.l },
});
