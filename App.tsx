import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { demoUsers } from './src/data/dummyData';
import { authService, validateRegistration } from './src/services/authService';
import { datingService } from './src/services/datingService';

type Screen = 'onboarding' | 'login' | 'register' | 'main';
type Tab = 'Home' | 'Matches' | 'Profile';
type Detail = 'none' | 'guide' | 'settings' | 'terms' | 'chat';
type Candidate = { name: string; age: number; major: string; year: string; bio: string; initials: string; color: string };

const candidates: Candidate[] = demoUsers.slice(1).map((user, index) => ({ name: user.name, age: Number(user.age), major: user.major, year: user.schoolyear, bio: user.bio, initials: user.name.slice(0, 2).toUpperCase(), color: ['#e78983', '#8f9dc7', '#c59db4'][index] }));

function App() {
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [tab, setTab] = useState<Tab>('Home');
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [liked, setLiked] = useState<Candidate[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<Detail>('none');
  const [chatPartner, setChatPartner] = useState<Candidate | null>(null);
  const candidate = candidates[candidateIndex];

  const login = () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill all fields');
      return;
    }
    if (!authService.signIn(email, password)) {
      setError('Login failed. Use the demo account or a valid password.');
      return;
    }
    setError('');
    setScreen('main');
  };

  const swipe = (isLike: boolean) => {
    if (isLike) setLiked(current => [...current, candidate]);
    setCandidateIndex(current => (current + 1) % candidates.length);
  };

  if (screen === 'onboarding') return <Onboarding onContinue={() => setScreen('login')} />;
  if (screen === 'login') {
    return <Login email={email} password={password} error={error} setEmail={setEmail} setPassword={setPassword} onLogin={login} onRegister={() => { setError(''); setScreen('register'); }} />;
  }
  if (screen === 'register') return <Register onBack={() => setScreen('login')} onCreate={() => setScreen('main')} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.appShell}>
        <View style={styles.topBar}>
          <Text style={styles.brand}>UMN Dating</Text>
          <View style={styles.topActions}><Pressable onPress={() => setDetail('guide')}><Text style={styles.topIcon}>?</Text></Pressable><Pressable onPress={() => setDetail('settings')}><Text style={styles.topIcon}>⚙</Text></Pressable></View>
        </View>
        <View style={styles.mainContent}>
          {detail === 'guide' && <Guide onBack={() => setDetail('none')} />}
          {detail === 'settings' && <Settings onBack={() => setDetail('none')} onTerms={() => setDetail('terms')} />}
          {detail === 'terms' && <Terms onBack={() => setDetail('settings')} />}
          {detail === 'chat' && chatPartner && <Chat partner={chatPartner} onBack={() => setDetail('none')} />}
          {detail === 'none' && tab === 'Home' && <Home candidate={candidate} onSwipe={swipe} />}
          {detail === 'none' && tab === 'Matches' && <Matches liked={liked} onChat={person => { setChatPartner(person); setDetail('chat'); }} />}
          {detail === 'none' && tab === 'Profile' && <Profile onLogout={() => setScreen('login')} onGuide={() => setDetail('guide')} onTerms={() => setDetail('terms')} />}
        </View>
        {detail === 'none' && <View style={styles.bottomNav}>
          {(['Home', 'Matches', 'Profile'] as Tab[]).map(item => (
            <Pressable key={item} onPress={() => setTab(item)} style={styles.navItem} accessibilityRole="tab" accessibilityState={{ selected: tab === item }}>
              <Text style={[styles.navIcon, tab === item && styles.activeNav]}>{item === 'Home' ? '♡' : item === 'Matches' ? '♥' : '●'}</Text>
              <Text style={[styles.navLabel, tab === item && styles.activeNav]}>{item}</Text>
            </Pressable>
          ))}
        </View>}
      </View>
    </SafeAreaView>
  );
}

function Logo() {
  return <View style={styles.logo}><Text style={styles.logoHeart}>♥</Text></View>;
}

function Onboarding({ onContinue }: { onContinue: () => void }) {
  return <SafeAreaView style={styles.pinkScreen}><StatusBar barStyle="light-content" /><View style={styles.onboarding}><View style={styles.decorTop}>♥</View><Logo /><Text style={styles.welcome}>Welcome to</Text><Text style={styles.onboardingTitle}>UMN Dating App</Text><Text style={styles.onboardingCopy}>Find your perfect match</Text><Text style={styles.onboardingSubcopy}>Connect with fellow students and make meaningful connections.</Text><Pressable onPress={onContinue} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Continue</Text></Pressable><Text style={styles.terms}>By continuing, you agree to our Terms and Conditions</Text></View></SafeAreaView>;
}

function Login({ email, password, error, setEmail, setPassword, onLogin, onRegister }: { email: string; password: string; error: string; setEmail: (value: string) => void; setPassword: (value: string) => void; onLogin: () => void; onRegister: () => void }) {
  return <KeyboardAvoidingView style={styles.safeArea} behavior="padding"><ScrollView contentContainerStyle={styles.authPage}><Logo /><Text style={styles.authTitle}>Welcome Back</Text><Text style={styles.authSubtitle}>Sign in to continue</Text><View style={styles.formCard}><Text style={styles.inputLabel}>Email</Text><TextInput value={email} onChangeText={setEmail} placeholder="yourname@student.umn.ac.id" placeholderTextColor="#aaa" keyboardType="email-address" autoCapitalize="none" style={styles.input} /><Text style={styles.inputLabel}>Password</Text><TextInput value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor="#aaa" secureTextEntry style={styles.input} />{error ? <Text style={styles.error}>{error}</Text> : null}<Pressable onPress={onLogin} style={styles.coralButton}><Text style={styles.coralButtonText}>Log In</Text></Pressable><Pressable><Text style={styles.link}>Forgot Password?</Text></Pressable></View><Text style={styles.accountPrompt}>Don't have an account? <Text onPress={onRegister} style={styles.link}>Sign Up</Text></Text></ScrollView></KeyboardAvoidingView>;
}

function Register({ onBack, onCreate }: { onBack: () => void; onCreate: () => void }) {
  const [agreed, setAgreed] = useState(false);
  return <KeyboardAvoidingView style={styles.safeArea} behavior="padding"><ScrollView contentContainerStyle={styles.authPage}><Pressable onPress={onBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.authTitle}>Create Account</Text><Text style={styles.authSubtitle}>Join UMN Dating today</Text><View style={styles.formCard}>{['Username', 'Password', 'Full Name', 'Email', 'Age', 'Gender', 'School Year', 'Major'].map(label => <TextInput key={label} placeholder={label} placeholderTextColor="#999" secureTextEntry={label === 'Password'} style={styles.input} />)}<Pressable onPress={() => setAgreed(!agreed)} style={styles.checkboxRow}><View style={[styles.checkbox, agreed && styles.checkboxChecked]}>{agreed && <Text style={styles.check}>✓</Text>}</View><Text style={styles.checkboxText}>I agree to the Terms and Conditions</Text></Pressable><Pressable onPress={onCreate} style={styles.coralButton}><Text style={styles.coralButtonText}>Sign Up</Text></Pressable></View></ScrollView></KeyboardAvoidingView>;
}

function Home({ candidate, onSwipe }: { candidate: Candidate; onSwipe: (like: boolean) => void }) {
  return <ScrollView contentContainerStyle={styles.home}><Text style={styles.homeTitle}>Find your match</Text><Text style={styles.homeSubtitle}>Swipe to discover someone new</Text><View style={styles.candidateCard}><View style={[styles.candidateImage, { backgroundColor: candidate.color }]}><Text style={styles.candidateInitials}>{candidate.initials}</Text><View style={styles.verified}><Text style={styles.verifiedText}>✓</Text></View></View><View style={styles.candidateInfo}><Text style={styles.candidateName}>{candidate.name}, {candidate.age}</Text><Text style={styles.candidateMeta}>{candidate.major} · Class of {candidate.year}</Text><Text style={styles.candidateBio}>{candidate.bio}</Text><View style={styles.chips}><Text style={styles.chip}>UMN Student</Text><Text style={styles.chip}>Nearby</Text></View></View></View><View style={styles.swipeActions}><Pressable onPress={() => onSwipe(false)} style={[styles.roundButton, styles.pass]}><Text style={styles.passText}>×</Text></Pressable><Pressable style={[styles.roundButton, styles.inspect]}><Text style={styles.inspectText}>⌕</Text></Pressable><Pressable onPress={() => onSwipe(true)} style={[styles.roundButton, styles.like]}><Text style={styles.likeText}>♥</Text></Pressable></View></ScrollView>;
}

function Matches({ liked, onChat }: { liked: Candidate[]; onChat: (person: Candidate) => void }) { return <ScrollView contentContainerStyle={styles.listPage}><Text style={styles.pageTitle}>Your Matches</Text><Text style={styles.pageSubtitle}>{liked.length ? 'People you have liked' : 'No matches yet'}</Text>{liked.length ? liked.map(person => <Pressable onPress={() => onChat(person)} style={styles.matchRow} key={person.name}><View style={[styles.avatar, { backgroundColor: person.color }]}><Text style={styles.avatarText}>{person.initials}</Text></View><View><Text style={styles.matchName}>{person.name}, {person.age}</Text><Text style={styles.matchMeta}>Tap to start a conversation</Text></View><Text style={styles.chevron}>›</Text></Pressable>) : <View style={styles.empty}><Text style={styles.emptyIcon}>♥</Text><Text style={styles.emptyTitle}>Start swiping to find your match!</Text></View>}</ScrollView>; }

function Profile({ onLogout, onGuide, onTerms }: { onLogout: () => void; onGuide: () => void; onTerms: () => void }) { return <ScrollView contentContainerStyle={styles.listPage}><View style={styles.profileHeader}><View style={styles.largeAvatar}><Text style={styles.avatarText}>YO</Text></View><Text style={styles.pageTitle}>Your Profile</Text><Text style={styles.pageSubtitle}>Manage your profile and preferences</Text></View><View style={styles.profileCard}><Text style={styles.cardTitle}>Profile Details</Text>{['Name|Your Name', 'Email|yourname@student.umn.ac.id', 'Age|20', 'Gender|Not specified', 'Major|Not specified'].map(row => { const [label, value] = row.split('|'); return <View style={styles.detailRow} key={label}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>; })}</View><Pressable style={styles.outlineButton}><Text style={styles.outlineText}>Edit Profile</Text></Pressable><Pressable onPress={onGuide} style={styles.settingsRow}><Text style={styles.settingsTitle}>How to use UMN Dating</Text><Text style={styles.chevron}>›</Text></Pressable><Pressable onPress={onTerms} style={styles.settingsRow}><Text style={styles.settingsTitle}>Terms and Conditions</Text><Text style={styles.chevron}>›</Text></Pressable><Pressable onPress={onLogout} style={styles.logout}><Text style={styles.logoutText}>Log Out</Text></Pressable></ScrollView>; }

function Guide({ onBack }: { onBack: () => void }) { return <ScrollView contentContainerStyle={styles.listPage}><BackHeader title="How to use UMN Dating" onBack={onBack} /><GuideItem icon="♥" title="Swipe to Match" copy="Swipe right to like, left to pass. When both users like each other, it is a match!" /><GuideItem icon="▣" title="Chat Features" copy="Open a match to start a conversation and keep your connections going." /><GuideItem icon="●" title="Profile Management" copy="Edit your profile and preferences from the Profile tab." /></ScrollView>; }

function GuideItem({ icon, title, copy }: { icon: string; title: string; copy: string }) { return <View style={styles.guideItem}><Text style={styles.guideIcon}>{icon}</Text><View style={styles.guideText}><Text style={styles.settingsTitle}>{title}</Text><Text style={styles.guideCopy}>{copy}</Text></View></View>; }

function Settings({ onBack, onTerms }: { onBack: () => void; onTerms: () => void }) { const [darkMode, setDarkMode] = useState(false); return <ScrollView contentContainerStyle={styles.listPage}><BackHeader title="Settings" onBack={onBack} /><View style={styles.settingsCard}><View style={styles.settingsRow}><Text style={styles.settingsTitle}>Dark Mode</Text><Pressable onPress={() => setDarkMode(!darkMode)} style={[styles.switch, darkMode && styles.switchOn]}><View style={[styles.switchKnob, darkMode && styles.switchKnobOn]} /></Pressable></View><Pressable onPress={onTerms} style={styles.settingsRow}><Text style={styles.settingsTitle}>Terms and Conditions</Text><Text style={styles.chevron}>›</Text></Pressable></View></ScrollView>; }

function BackHeader({ title, onBack }: { title: string; onBack: () => void }) { return <View style={styles.detailHeader}><Pressable onPress={onBack}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.detailTitle}>{title}</Text></View>; }

function Terms({ onBack }: { onBack: () => void }) { return <ScrollView contentContainerStyle={styles.listPage}><BackHeader title="Terms and Conditions" onBack={onBack} /><View style={styles.termsCard}><Text style={styles.termsHeading}>Terms and Conditions</Text><Text style={styles.termsDate}>Last updated: January 2025</Text>{[['1. Acceptance of Terms', 'By using UMN Dating, you agree to be bound by these Terms and Conditions.'], ['2. Eligibility', 'You must be a current student of Universitas Multimedia Nusantara and at least 18 years old.'], ['3. User Conduct', 'Maintain respectful behavior, provide accurate information, and do not engage in harassment or spam.'], ['4. Privacy and Data', 'Your profile information is visible to other UMN students using the app.']].map(([heading, copy]) => <View key={heading} style={styles.termSection}><Text style={styles.termHeading}>{heading}</Text><Text style={styles.termCopy}>{copy}</Text></View>)}</View></ScrollView>; }

function Chat({ partner, onBack }: { partner: Candidate; onBack: () => void }) { const [message, setMessage] = useState(''); const [messages, setMessages] = useState(['Hi! Nice to meet you.']); return <KeyboardAvoidingView style={styles.chatPage} behavior="padding"><BackHeader title={`${partner.name}, ${partner.age}`} onBack={onBack} /><ScrollView contentContainerStyle={styles.messages}>{messages.map((item, index) => <View key={`${item}-${index}`} style={[styles.message, index % 2 === 0 ? styles.received : styles.sent]}><Text style={index % 2 === 0 ? styles.receivedText : styles.sentText}>{item}</Text></View>)}</ScrollView><View style={styles.chatComposer}><TextInput value={message} onChangeText={setMessage} placeholder="Type a message..." placeholderTextColor="#999" style={styles.messageInput} /><Pressable onPress={() => { if (message.trim()) { setMessages(current => [...current, message.trim()]); setMessage(''); } }} style={styles.sendButton}><Text style={styles.sendText}>↑</Text></Pressable></View></KeyboardAvoidingView>; }

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff8f8' },
  pinkScreen: { flex: 1, backgroundColor: '#e76e6e' },
  onboarding: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  decorTop: { position: 'absolute', top: 70, right: 42, color: 'rgba(255,255,255,0.18)', fontSize: 44 },
  logo: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 28, shadowColor: '#8d4242', shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
  logoHeart: { color: '#e76e6e', fontSize: 70 },
  welcome: { color: '#ffe9e9', fontSize: 20 },
  onboardingTitle: { color: '#fff', fontSize: 38, fontWeight: '800', marginTop: 4, textAlign: 'center' },
  onboardingCopy: { color: '#fff', fontSize: 18, marginTop: 18 },
  onboardingSubcopy: { color: '#ffe9e9', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10, maxWidth: 290 },
  primaryButton: { backgroundColor: '#fff', borderRadius: 30, width: '100%', paddingVertical: 17, alignItems: 'center', marginTop: 44 },
  primaryButtonText: { color: '#df6464', fontSize: 16, fontWeight: '800' },
  terms: { color: '#ffe9e9', fontSize: 11, marginTop: 18, textAlign: 'center' },
  authPage: { flexGrow: 1, padding: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff8f8' },
  authTitle: { color: '#272525', fontSize: 31, fontWeight: '800', marginTop: 2 },
  authSubtitle: { color: '#777', fontSize: 15, marginTop: 7, marginBottom: 22 },
  formCard: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 22, shadowColor: '#6e3030', shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 },
  inputLabel: { color: '#4d4a4a', fontSize: 13, fontWeight: '700', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#fff', borderColor: '#e5dede', borderWidth: 1, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#222', marginBottom: 10 },
  error: { color: '#c33e3e', fontSize: 12, marginBottom: 9 },
  coralButton: { backgroundColor: '#e76e6e', borderRadius: 28, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  coralButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  link: { color: '#d95763', fontWeight: '700' },
  accountPrompt: { color: '#777', marginTop: 20, fontSize: 13 },
  back: { alignSelf: 'flex-start', marginBottom: 15 },
  backText: { fontSize: 40, color: '#e76e6e', lineHeight: 40 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: '#d9baba', borderRadius: 4, marginRight: 9, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#e76e6e', borderColor: '#e76e6e' },
  check: { color: '#fff', fontWeight: '800' },
  checkboxText: { color: '#777', fontSize: 12 },
  appShell: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0e3e3' },
  brand: { color: '#df6464', fontSize: 23, fontWeight: '800' },
  topActions: { flexDirection: 'row', gap: 18 },
  topIcon: { color: '#736c6c', fontSize: 20, fontWeight: '700' },
  mainContent: { flex: 1 },
  home: { padding: 22, paddingBottom: 28 },
  homeTitle: { color: '#272525', fontSize: 28, fontWeight: '800' },
  homeSubtitle: { color: '#8a8080', fontSize: 14, marginTop: 5, marginBottom: 18 },
  candidateCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#5c3939', shadowOpacity: 0.13, shadowRadius: 12, elevation: 4 },
  candidateImage: { height: 310, alignItems: 'center', justifyContent: 'center' },
  candidateInitials: { color: '#fff', fontSize: 75, fontWeight: '800' },
  verified: { position: 'absolute', right: 15, bottom: 15, width: 28, height: 28, borderRadius: 14, backgroundColor: '#e76e6e', alignItems: 'center', justifyContent: 'center' },
  verifiedText: { color: '#fff', fontWeight: '800' },
  candidateInfo: { padding: 20 },
  candidateName: { color: '#252323', fontSize: 25, fontWeight: '800' },
  candidateMeta: { color: '#8c8181', fontSize: 13, marginTop: 5 },
  candidateBio: { color: '#4e4949', fontSize: 14, lineHeight: 21, marginTop: 14 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 14 },
  chip: { borderRadius: 14, paddingHorizontal: 11, paddingVertical: 6, color: '#c75c63', backgroundColor: '#fff0f0', fontSize: 11, overflow: 'hidden' },
  swipeActions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 22 },
  roundButton: { borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  pass: { width: 66, height: 66, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f0cccc' },
  inspect: { width: 57, height: 57, backgroundColor: '#f5eafa' },
  like: { width: 76, height: 76, backgroundColor: '#e76e6e' },
  passText: { color: '#d86868', fontSize: 34 },
  inspectText: { color: '#9652a3', fontSize: 28 },
  likeText: { color: '#fff', fontSize: 30 },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eddfdf', paddingTop: 10, paddingBottom: 8, backgroundColor: '#fff' },
  navItem: { flex: 1, alignItems: 'center', gap: 3 },
  navIcon: { color: '#b8aaaa', fontSize: 21 },
  navLabel: { color: '#9d9090', fontSize: 11 },
  activeNav: { color: '#e76e6e', fontWeight: '800' },
  listPage: { padding: 22, paddingBottom: 30 },
  pageTitle: { color: '#272525', fontSize: 28, fontWeight: '800' },
  pageSubtitle: { color: '#8a8080', fontSize: 14, marginTop: 5, marginBottom: 20 },
  matchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 15, padding: 13, marginBottom: 10, shadowColor: '#5c3939', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  avatarText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  matchName: { color: '#312d2d', fontSize: 16, fontWeight: '700' },
  matchMeta: { color: '#9b9090', fontSize: 12, marginTop: 4 },
  chevron: { color: '#db7777', fontSize: 28, marginLeft: 'auto' },
  empty: { alignItems: 'center', paddingTop: 100 },
  emptyIcon: { color: '#e76e6e', fontSize: 60 },
  emptyTitle: { color: '#777', fontSize: 14, marginTop: 16 },
  profileHeader: { alignItems: 'center', marginBottom: 22 },
  largeAvatar: { width: 108, height: 108, borderRadius: 54, backgroundColor: '#e78983', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  profileCard: { backgroundColor: '#fff', borderRadius: 17, padding: 20, shadowColor: '#5c3939', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  cardTitle: { color: '#302b2b', fontSize: 17, fontWeight: '800', marginBottom: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f0e7e7', paddingVertical: 13 },
  detailLabel: { color: '#777', fontSize: 13, fontWeight: '700' },
  detailValue: { color: '#9b9090', fontSize: 13 },
  outlineButton: { borderColor: '#e76e6e', borderWidth: 1, borderRadius: 26, alignItems: 'center', paddingVertical: 14, marginTop: 20 },
  outlineText: { color: '#d65f65', fontWeight: '800' },
  logout: { alignItems: 'center', paddingVertical: 16 },
  logoutText: { color: '#bd5555', fontWeight: '700' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 14, padding: 17, marginTop: 12, shadowColor: '#5c3939', shadowOpacity: 0.06, shadowRadius: 7, elevation: 2 },
  settingsTitle: { color: '#302b2b', fontSize: 15, fontWeight: '700' },
  settingsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 5 },
  switch: { width: 46, height: 27, borderRadius: 15, backgroundColor: '#ddd', padding: 3 },
  switchOn: { backgroundColor: '#e76e6e' },
  switchKnob: { width: 21, height: 21, borderRadius: 11, backgroundColor: '#fff' },
  switchKnobOn: { alignSelf: 'flex-end' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  detailTitle: { color: '#272525', fontSize: 23, fontWeight: '800', marginLeft: 12 },
  guideItem: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 17, marginBottom: 12, shadowColor: '#5c3939', shadowOpacity: 0.06, shadowRadius: 7, elevation: 2 },
  guideIcon: { color: '#e76e6e', fontSize: 25, width: 38 },
  guideText: { flex: 1 },
  guideCopy: { color: '#777', fontSize: 13, lineHeight: 19, marginTop: 5 },
  termsCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20 },
  termsHeading: { color: '#272525', fontSize: 23, fontWeight: '800', textAlign: 'center' },
  termsDate: { color: '#999', fontSize: 12, textAlign: 'center', marginTop: 6, marginBottom: 22 },
  termSection: { marginBottom: 18 },
  termHeading: { color: '#302b2b', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  termCopy: { color: '#555', fontSize: 14, lineHeight: 21 },
  chatPage: { flex: 1, paddingHorizontal: 22 },
  messages: { flexGrow: 1, justifyContent: 'flex-end', paddingVertical: 20 },
  message: { borderRadius: 17, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 9, maxWidth: '78%' },
  received: { alignSelf: 'flex-start', backgroundColor: '#fff', borderTopLeftRadius: 4 },
  sent: { alignSelf: 'flex-end', backgroundColor: '#e76e6e', borderTopRightRadius: 4 },
  receivedText: { color: '#444', fontSize: 14 },
  sentText: { color: '#fff', fontSize: 14 },
  chatComposer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#eddfdf' },
  messageInput: { flex: 1, backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 17, paddingVertical: 11, color: '#222', borderWidth: 1, borderColor: '#eadede' },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e76e6e', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  sendText: { color: '#fff', fontSize: 22, fontWeight: '800' },
});

export default App;
