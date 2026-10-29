import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, HEADER_EDGES, OptionPicker, Screen, TextField } from '../../src/components/ui';
import { GENDERS, MAJORS, MIN_AGE, schoolYearOptions } from '../../src/constants/options';
import { PersonPlaceholder } from '../../src/components/Avatar';
import { BirthDateField } from '../../src/components/BirthDateField';
import { PreferenceFields } from '../../src/components/PreferenceFields';
import { useTheme } from '../../src/constants/theme';
import { useAuth } from '../../src/providers/AuthProvider';
import { friendlyAuthError } from '../../src/services/auth';
import { ageFromBirthDate } from '../../src/utils/age';
import { oppositeGender } from '../../src/utils/preferences';
import { uploadProfilePhoto } from '../../src/services/uploads';
import { getUser, updateUser } from '../../src/services/users';
import { MajorCode, Preferences, UserProfile } from '../../src/types';

const majorOptions = MAJORS.map((m) => ({ value: m.code, label: m.label }));

// Port of ProfileEditActivity. Email and gender are read-only, like before.
// Not ported yet: the on-device photo check. New photos are saved with photoVerified = false until verification is rebuilt.
export default function EditProfile() {
  const t = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [loaded, setLoaded] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<{ uri: string; base64: string } | null>(null); // newly picked photo, not uploaded yet
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [schoolyear, setSchoolyear] = useState('');
  const [major, setMajor] = useState('');
  const [prefs, setPrefs] = useState<Preferences>({ gender: 'F', yearPreferences: 'All', majorPreferences: [] });

  useEffect(() => {
    if (!user) return;
    getUser(user.uid)
      .then((p) => {
        if (!p) return Alert.alert('User data not found.');
        setLoaded(p);
        setUsername(p.username);
        setName(p.name);
        setBio(p.bio);
        setBirthDate(p.birthDate ?? '');
        setSchoolyear(p.schoolyear);
        setMajor(p.major ?? '');
        setPrefs(p.preference);
      })
      .catch(() => Alert.alert('Failed to load profile'));
  }, [user]);

  function choosePhotoSource() {
    Alert.alert('Choose Photo Source', undefined, [
      { text: 'Gallery', onPress: openGallery },
      { text: 'Camera', onPress: openCamera },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function openGallery() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!res.canceled) acceptPicked(res.assets[0]);
  }

  function acceptPicked(asset: ImagePicker.ImagePickerAsset) {
    if (!asset.base64) return Alert.alert('Could not read that photo', 'Please pick a different one.');
    setPhoto({ uri: asset.uri, base64: asset.base64 });
  }

  async function openCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert('Camera permission required to take photos');
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true });
    if (!res.canceled) acceptPicked(res.assets[0]);
  }

  async function onSave() {
    if (!user || !loaded) return;
    const age = ageFromBirthDate(birthDate);
    if (age === null) return Alert.alert('Please enter your date of birth');
    if (age < MIN_AGE) return Alert.alert(`Minimum age is ${MIN_AGE}`);
    if (!username.trim() || !name.trim()) return Alert.alert('Username and name are required');

    setSaving(true);
    let photoUrl: string | undefined;
    if (photo) {
      try {
        photoUrl = await uploadProfilePhoto(photo.base64);
      } catch (e) {
        setSaving(false);
        return Alert.alert('Photo upload failed', friendlyAuthError(e));
      }
    }
    try {
      const patch: Parameters<typeof updateUser>[1] = {
        username: username.trim(),
        name: name.trim(),
        bio: bio.trim(),
        birthDate,
        schoolyear,
        major: (major || undefined) as MajorCode | undefined,
        preference: { ...prefs, gender: oppositeGender(loaded.gender) },
      };
      if (!patch.major) delete patch.major; // Firestore rejects undefined values
      if (photoUrl) {
        patch.photoUrl = photoUrl;
        patch.photoVerified = false;
      }
      await updateUser(user.uid, patch);
      router.back();
    } catch (e) {
      Alert.alert('Failed to update profile', friendlyAuthError(e));
    } finally {
      setSaving(false);
    }
  }

  // The intake years follow the calendar; keep the saved one in the list even when it has dropped out of the window.
  const yearOptions = Array.from(new Set([...(schoolyear ? [schoolyear] : []), ...schoolYearOptions()]))
    .sort()
    .map((y) => ({ value: y, label: y }));
  const shownPhoto = photo?.uri ?? loaded?.photoUrl;

  return (
    <Screen edges={HEADER_EDGES}>
      {!loaded ? (
        <ActivityIndicator color={t.primary} style={{ marginTop: 32 }} />
      ) : (
        <>
          <Pressable onPress={choosePhotoSource} style={{ alignItems: 'center', marginBottom: 16 }} accessibilityRole="button">
            {shownPhoto ? (
              <Image source={{ uri: shownPhoto }} style={styles.photo} contentFit="cover" />
            ) : (
              <PersonPlaceholder style={styles.photo} iconSize={76} />
            )}
            <Text style={{ color: t.primary, fontWeight: '600', marginTop: 8 }}>Change photo</Text>
          </Pressable>

          <TextField placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <TextField placeholder="Full name" value={name} onChangeText={setName} />
          <TextField placeholder="Bio" value={bio} onChangeText={setBio} multiline style={{ height: 96, paddingTop: 14, textAlignVertical: 'top' }} />
          <BirthDateField value={birthDate} onChange={setBirthDate} />
          <OptionPicker label="School year" value={schoolyear} onChange={setSchoolyear} options={yearOptions} />
          <OptionPicker label="Major" value={major} onChange={setMajor} options={majorOptions} />
          <TextField value={loaded.email} editable={false} style={{ opacity: 0.6 }} />
          <TextField value={GENDERS.find((g) => g.code === loaded.gender)?.label ?? ''} editable={false} style={{ opacity: 0.6 }} />

          <Text style={[styles.section, { color: t.primary }]}>I'm looking for</Text>
          <PreferenceFields value={prefs} onChange={setPrefs} />

          <Button title="Save" onPress={onSave} loading={saving} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: 140, height: 140, borderRadius: 70 },
  section: { fontWeight: '700', marginTop: 12, marginBottom: 8 },
});
