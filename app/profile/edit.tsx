import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, OptionPicker, Screen, TextField } from '../../src/components/ui';
import { GENDERS, MAJORS, MIN_AGE, SCHOOL_YEARS, YEAR_PREFERENCES } from '../../src/constants/options';
import { useTheme } from '../../src/constants/theme';
import { useAuth } from '../../src/providers/AuthProvider';
import { friendlyAuthError } from '../../src/services/auth';
import { uploadProfilePhoto } from '../../src/services/uploads';
import { getUser, updateUser } from '../../src/services/users';
import { Gender, MajorCode, UserProfile } from '../../src/types';

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
  const [age, setAge] = useState('');
  const [schoolyear, setSchoolyear] = useState('');
  const [major, setMajor] = useState('');
  const [prefGender, setPrefGender] = useState<Gender>('F');
  const [prefYear, setPrefYear] = useState('All');
  const [prefMajors, setPrefMajors] = useState<MajorCode[]>([]);

  useEffect(() => {
    if (!user) return;
    getUser(user.uid)
      .then((p) => {
        if (!p) return Alert.alert('User data not found.');
        setLoaded(p);
        setUsername(p.username);
        setName(p.name);
        setBio(p.bio);
        setAge(p.age ? String(p.age) : '');
        setSchoolyear(p.schoolyear);
        setMajor(p.major ?? '');
        setPrefGender(p.preference.gender);
        setPrefYear(p.preference.yearPreferences);
        setPrefMajors(p.preference.majorPreferences);
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
    const ageNum = Number(age);
    if (!Number.isInteger(ageNum) || ageNum < MIN_AGE) return Alert.alert(`Minimum age is ${MIN_AGE}`);
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
        age: ageNum,
        schoolyear,
        major: (major || undefined) as MajorCode | undefined,
        preference: { gender: prefGender, yearPreferences: prefYear, majorPreferences: prefMajors },
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

  const shownPhoto = photo?.uri ?? loaded?.photoUrl;
  const remainingMajors = majorOptions.filter((m) => !prefMajors.includes(m.value as MajorCode));

  return (
    <Screen>
      <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={12}>
        <Text style={{ color: t.text, fontSize: 24 }}>←</Text>
      </Pressable>
      <Text style={[styles.title, { color: t.text }]}>Edit Profile</Text>

      {!loaded ? (
        <ActivityIndicator color={t.primary} style={{ marginTop: 32 }} />
      ) : (
        <>
          <Pressable onPress={choosePhotoSource} style={{ alignItems: 'center', marginBottom: 16 }} accessibilityRole="button">
            {shownPhoto ? (
              <Image source={{ uri: shownPhoto }} style={styles.photo} contentFit="cover" />
            ) : (
              <View style={[styles.photo, { backgroundColor: t.surfaceVariant }]} />
            )}
            <Text style={{ color: t.primary, fontWeight: '600', marginTop: 8 }}>Change photo</Text>
          </Pressable>

          <TextField placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <TextField placeholder="Full name" value={name} onChangeText={setName} />
          <TextField placeholder="Bio" value={bio} onChangeText={setBio} multiline style={{ height: 96, paddingTop: 14, textAlignVertical: 'top' }} />
          <TextField placeholder="Age" value={age} onChangeText={setAge} keyboardType="number-pad" />
          <OptionPicker label="School year" value={schoolyear} onChange={setSchoolyear} options={SCHOOL_YEARS.map((y) => ({ value: y, label: y }))} />
          <OptionPicker label="Major" value={major} onChange={setMajor} options={majorOptions} />
          <TextField value={loaded.email} editable={false} style={{ opacity: 0.6 }} />
          <TextField value={GENDERS.find((g) => g.code === loaded.gender)?.label ?? ''} editable={false} style={{ opacity: 0.6 }} />

          <Text style={[styles.section, { color: t.primary }]}>I'm looking for</Text>
          <OptionPicker label="Gender" value={prefGender} onChange={(v) => setPrefGender(v as Gender)} options={GENDERS.map((g) => ({ value: g.code, label: g.label }))} />
          <OptionPicker label="Batch" value={prefYear} onChange={setPrefYear} options={YEAR_PREFERENCES} />

          <View style={styles.chips}>
            {prefMajors.map((code) => (
              <Pressable
                key={code}
                onPress={() => setPrefMajors((list) => list.filter((c) => c !== code))}
                style={[styles.chip, { backgroundColor: t.lightPink, borderColor: t.primary }]}
                accessibilityLabel={`Remove ${code}`}
              >
                <Text style={{ color: t.primary }}>{MAJORS.find((m) => m.code === code)?.label ?? code}  ✕</Text>
              </Pressable>
            ))}
          </View>
          {remainingMajors.length > 0 && (
            <OptionPicker
              label="+ Add a major preference"
              value=""
              onChange={(v) => setPrefMajors((list) => [...list, v as MajorCode])}
              options={remainingMajors}
            />
          )}

          <Button title="Save" onPress={onSave} loading={saving} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', marginVertical: 12 },
  photo: { width: 140, height: 140, borderRadius: 70 },
  section: { fontWeight: '700', marginTop: 12, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
});
