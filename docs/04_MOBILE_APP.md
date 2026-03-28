# CREDENTIA — Mobile App (React Native CLI + Android Studio)
### File 04 — Complete Mobile App

---

> ⚡ **CODEX REVIEW:** The Codex will review all of your codes after your execution.

---

## ⚡ ANTIGRAVITY PROMPT — MOBILE APP (Ek Hi Prompt Mein)

```
Build a complete React Native mobile app for CREDENTIA credential verification platform using React Native CLI and Android Studio.

TECH STACK:
- React Native CLI (latest) + TypeScript
- @react-navigation/native (file-based routing)
- @react-navigation/bottom-tabs (bottom tab navigator)
- @react-navigation/native-stack (stack navigator)
- react-native-reanimated 3 (animations)
- react-native-document-picker (file uploads)
- react-native-image-picker (camera + gallery)
- react-native-keychain (secure token storage)
- react-native-qrcode-svg (QR code display)
- @react-native-clipboard/clipboard (copy to clipboard)
- react-native-share (native share sheet)
- axios (API calls)
- @supabase/supabase-js (auth)
- react-native-config (environment variables)
- react-native-safe-area-context
- react-native-screens
- react-native-gesture-handler
- react-native-vector-icons (Lucide or Feather icons)

SETUP COMMANDS (run these in order in terminal):

# Step 1: Initialize React Native project
npx react-native@latest init CredentiaApp --template react-native-template-typescript
cd CredentiaApp

# Step 2: Install navigation core
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler

# Step 3: Install file/media pickers
npm install react-native-document-picker
npm install react-native-image-picker

# Step 4: Install storage and auth utilities
npm install react-native-keychain
npm install @react-native-clipboard/clipboard
npm install react-native-share
npm install react-native-config

# Step 5: Install UI and utility
npm install react-native-qrcode-svg react-native-svg
npm install axios @supabase/supabase-js
npm install react-native-reanimated
npm install react-native-vector-icons
npm install @react-native-community/progress-bar-android

# Step 6: iOS pods (skip if Android only)
# cd ios && pod install && cd ..

# Step 7: Android specific — link vector icons
# In android/app/build.gradle, add: apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"

ENVIRONMENT (.env):
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
API_URL=https://credentiaonline.in/api

ANDROID STUDIO SETUP (Do this BEFORE running the app):
1. Download Android Studio from: https://developer.android.com/studio
2. Install with default settings (includes Android SDK)
3. Open Android Studio → SDK Manager → Install:
   - Android SDK Platform 34 (Android 14)
   - Android SDK Build-Tools 34.0.0
   - Android Emulator
4. Set environment variable ANDROID_HOME:
   Windows: System Variables → ANDROID_HOME = C:\Users\YourName\AppData\Local\Android\Sdk
   Mac/Linux: Add to ~/.bashrc: export ANDROID_HOME=$HOME/Library/Android/sdk
5. Also add to PATH: %ANDROID_HOME%\platform-tools (Windows) or $ANDROID_HOME/platform-tools (Mac)
6. Create AVD: Android Studio → Device Manager → Create Device → Pixel 7 → API 34 → Finish

RUNNING THE APP IN ANDROID STUDIO:
Method A (Recommended — Emulator):
1. Open Android Studio → Open the 'android' folder inside CredentiaApp
2. Click green "Run" button → Select your AVD emulator
3. In a separate terminal: cd CredentiaApp && npx react-native start
4. App auto-loads on emulator

Method B (Physical Device):
1. Enable Developer Mode on your Android phone
2. Enable USB Debugging
3. Connect phone via USB
4. In terminal: npx react-native run-android

═══════════════════════════════════
DESIGN SYSTEM (match exactly with website):
═══════════════════════════════════
Dark theme constants:
const COLORS = {
  bg: '#0A0A0F',
  card: '#13131A',
  elevated: '#1C1C26',
  border: '#2A2A3A',
  primary: '#F5C542',
  text: '#FFFFFF',
  muted: '#9999AA',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
}

═══════════════════════════════════
FILE STRUCTURE:
═══════════════════════════════════
src/
├── navigation/
│   ├── RootNavigator.tsx         ← Root navigation (auth check)
│   ├── AuthNavigator.tsx         ← Auth stack (onboarding, login, register)
│   ├── StudentNavigator.tsx      ← Student bottom tabs
│   └── CompanyNavigator.tsx      ← Company bottom tabs
├── screens/
│   ├── auth/
│   │   ├── OnboardingScreen.tsx  ← 3-screen onboarding
│   │   ├── LoginScreen.tsx       ← Login
│   │   └── RegisterScreen.tsx    ← Register
│   ├── student/
│   │   ├── DashboardScreen.tsx   ← Home dashboard
│   │   ├── ResumeScreen.tsx      ← Resume upload + analysis
│   │   ├── PoliceScreen.tsx      ← Police verification
│   │   ├── AadhaarScreen.tsx     ← Aadhaar
│   │   ├── MyLinkScreen.tsx      ← Shareable link + QR
│   │   └── ProfileScreen.tsx     ← Profile settings
│   ├── company/
│   │   ├── DashboardScreen.tsx   ← Company dashboard
│   │   └── CandidatesScreen.tsx  ← Candidate list with filters
│   └── public/
│       └── VerifyProfileScreen.tsx ← Public verified profile
├── components/
│   ├── common/
│   │   ├── VerificationBadge.tsx ← Status badge component
│   │   ├── ScoreGauge.tsx        ← Circular score gauge
│   │   └── LoadingSequence.tsx   ← Multi-step loading text
│   └── ui/
│       ├── Button.tsx            ← Custom button
│       ├── Card.tsx              ← Dark card wrapper
│       └── Input.tsx             ← Styled text input
├── lib/
│   ├── supabase.ts               ← Supabase client
│   ├── api.ts                    ← Axios API calls
│   └── storage.ts                ← Keychain token helpers
├── hooks/
│   └── useAuth.ts                ← Auth state hook
└── constants/
    └── colors.ts                 ← COLORS constant

═══════════════════════════════════
SCREEN 1: src/screens/auth/OnboardingScreen.tsx — ONBOARDING
═══════════════════════════════════
3-screen animated onboarding:

Screen 1: Logo + "Credentia" title + "Verify Once. Trusted Forever."
Screen 2: Illustration + "Upload documents, get AI-verified in minutes"
Screen 3: Share icon + "One link. Show your verified credentials everywhere."

Navigation: FlatList with pagingEnabled, horizontal scrolling
Bottom: dot pagination indicators (active dot = #F5C542, inactive = #2A2A3A)
Last screen: "Get Started" button + "Already have account? Login" link
Background: linear gradient from #0A0A0F to #1C1C26

Use Reanimated for page transitions (FadeIn, entering animations).

Implementation:
```tsx
import React, { useRef, useState } from 'react'
import { FlatList, View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

const { width } = Dimensions.get('window')
const slides = [
  { id: '1', title: 'Credentia', subtitle: 'Verify Once. Trusted Forever.', icon: '🏆' },
  { id: '2', title: 'Upload & Verify', subtitle: 'Upload documents, get AI-verified in minutes', icon: '📄' },
  { id: '3', title: 'Share Everywhere', subtitle: 'One link. Show your verified credentials everywhere.', icon: '🔗' },
]

export default function OnboardingScreen({ navigation }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const flatListRef = useRef(null)
  // ... FlatList horizontal scroll with dot indicators
}
```

═══════════════════════════════════
SCREEN 2: src/screens/auth/LoginScreen.tsx — LOGIN
═══════════════════════════════════

Layout (ScrollView, KeyboardAvoidingView):
- CREDENTIA logo + tagline at top
- Role selector (4 horizontal tabs): Student | Company | University | Admin
  Active tab: #F5C542 underline + white text
  Inactive: #9999AA text

- Form changes per role (same as website)
- Email TextInput: keyboardType="email-address", autoCapitalize="none"
- Password TextInput: secureTextEntry, with eye toggle button
- "Login" TouchableOpacity: bg #F5C542, text black, rounded-xl, full width
- Loading: ActivityIndicator inside button
- Error: red text below form
- "Register" link at bottom

On login success, use react-native-keychain to save session:
```tsx
import * as Keychain from 'react-native-keychain'
await Keychain.setGenericPassword('credentia_session', JSON.stringify(session))
```

Redirect to role dashboard using navigation.replace():
```tsx
if (role === 'student') navigation.replace('StudentTabs')
if (role === 'company') navigation.replace('CompanyTabs')
```

═══════════════════════════════════
SCREEN 3: src/screens/auth/RegisterScreen.tsx — REGISTER
═══════════════════════════════════

Step 1: 4 role cards (2x2 grid, each a TouchableOpacity with icon + text)
Step 2: Multi-field form based on role
Both steps with Reanimated FadeIn transition.

On success: supabase.auth.signUp() with role metadata → navigate to dashboard.

═══════════════════════════════════
SCREEN 4: src/screens/student/DashboardScreen.tsx — STUDENT DASHBOARD
═══════════════════════════════════

ScrollView layout (inspired by Crextio, adapted for mobile):

TOP BAR:
- CREDENTIA text left, notification bell + avatar right
- Dynamic greeting: "Good morning, Rahul! ☀️"
- Smaller date below

VERIFICATION SCORE CARD (full width):
Gradient card (#F5C542 → #D4A017):
- "Verification Score" label (black text)
- "72/100" large number (Syne-style, black)
- Circular progress ring (SVG-based gauge using react-native-svg)
- "Police Verified: Pending ⏳" below

4 QUICK STATUS PILLS (2x2 grid):
Each: rounded-xl card with icon + name + status dot
Resume: ✅ / ⏳ / ❌
Police: ✅ / ⏳ / ❌
Aadhaar: ✅ / ⏳ / ❌
Degree: ✅ / ⏳ / ❌

Animated entrance: each card entering with Reanimated FadeInDown and stagger delay.
```tsx
import Animated, { FadeInDown } from 'react-native-reanimated'

// Each status card with stagger
{statusPills.map((pill, index) => (
  <Animated.View 
    key={pill.id}
    entering={FadeInDown.delay(index * 100).springify()}
  >
    <StatusPill {...pill} />
  </Animated.View>
))}
```

VERIFICATION TASKS LIST (FlatList, 6 items):
Like Crextio's Onboarding task list:
Each item: small icon circle + task name + status checkbox
Completed: yellow checkbox ✅
Pending: gray circle ◯

Tapping any item → navigation.navigate() to that verification screen.

RECENT ACTIVITY (last 3 items):
Small timeline with colored dots and action text.

SHAREABLE LINK QUICK CARD:
"Your verified link:" + short URL + [Copy] button
On copy:
```tsx
import Clipboard from '@react-native-clipboard/clipboard'
Clipboard.setString(profileUrl)
// Show toast: "Copied!"
```

═══════════════════════════════════
SCREEN 5: src/screens/student/ResumeScreen.tsx
═══════════════════════════════════

2 input method tabs: "Upload File" | "Paste Link"

UPLOAD TAB:
TouchableOpacity dashed border zone:
On tap: react-native-document-picker opens
```tsx
import DocumentPicker from 'react-native-document-picker'

const pickDocument = async () => {
  const result = await DocumentPicker.pick({
    type: [
      DocumentPicker.types.pdf,
      DocumentPicker.types.docx,
      DocumentPicker.types.images,
    ],
  })
  setSelectedFile(result[0])
}
```
Shows selected filename after pick.

"Analyze Resume" button → loading → results

LINK TAB:
TextInput for URL
"Analyze" button

RESULTS (shown below after Groq responds):
- Large ATS Score animated from 0 to value using Reanimated:
```tsx
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated'

const score = useSharedValue(0)
useEffect(() => {
  score.value = withTiming(atsScore, { duration: 1200 })
}, [atsScore])
```
- Authenticity badge (green/red pill)
- Found keywords (green scrollable chips in horizontal FlatList)
- Missing keywords (red outlined chips)
- AI feedback text
- "Share Score" button

═══════════════════════════════════
SCREEN 6: src/screens/student/PoliceScreen.tsx
═══════════════════════════════════

3 input method tabs: "Upload File" | "Paste Link" | "Enter Manually"

UPLOAD: react-native-document-picker + react-native-image-picker (camera option too)
```tsx
import { launchCamera, launchImageLibrary } from 'react-native-image-picker'

// For camera capture
const captureFromCamera = () => {
  launchCamera({ mediaType: 'photo', quality: 0.9 }, (response) => {
    if (!response.didCancel && response.assets) {
      setSelectedFile(response.assets[0])
    }
  })
}

// For gallery
const pickFromGallery = () => {
  launchImageLibrary({ mediaType: 'mixed' }, (response) => {
    if (!response.didCancel && response.assets) {
      setSelectedFile(response.assets[0])
    }
  })
}
```

LINK: TextInput for URL
MANUAL: Form with Certificate No, Date (DateTimePicker), Authority, District, State dropdown

"Submit for Verification" button

Loading sequence with animated text updates using Reanimated:
"Uploading..." → "Extracting..." → "AI Analyzing..." → "Done!"

Result card with confidence score and status badge.

STATUS STEPS (horizontal stepper):
Submitted ──── AI Review ──── Admin Review ──── Verified
Current step highlighted in yellow #F5C542.

═══════════════════════════════════
SCREEN 7: src/screens/student/MyLinkScreen.tsx
═══════════════════════════════════

Center layout (ScrollView):
- "Your Verified Profile" heading (font-syne style, bold)
- QR Code (react-native-qrcode-svg):
```tsx
import QRCode from 'react-native-qrcode-svg'

<QRCode
  value={`https://credentiaonline.in/verify/${shareToken}`}
  size={200}
  color="#F5C542"
  backgroundColor="#13131A"
/>
```
- URL text (monospace font, tap to copy)
- [Copy Link] button → Clipboard.setString() → show "Copied! ✓" toast
- [Share] button → react-native-share native sheet:
```tsx
import Share from 'react-native-share'

const shareProfile = async () => {
  await Share.open({
    title: 'My Verified Credentials',
    message: `Check my verified credentials: https://credentiaonline.in/verify/${shareToken}`,
    url: `https://credentiaonline.in/verify/${shareToken}`,
  })
}
```
- WhatsApp direct share:
```tsx
import { Linking } from 'react-native'
const shareWhatsApp = () => {
  const message = `Check my verified credentials: https://credentiaonline.in/verify/${shareToken}`
  Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`)
}
```
- LinkedIn: `Linking.openURL('https://www.linkedin.com/sharing/share-offsite/?url=...')`

MINI PROFILE PREVIEW:
Shows what others see when they open the link:
Verification badges in a compact row with colored dots.

═══════════════════════════════════
SCREEN 8: src/navigation/StudentNavigator.tsx — BOTTOM TAB NAV
═══════════════════════════════════

5 tabs using @react-navigation/bottom-tabs:
Tab 1: 🏠 Home → DashboardScreen
Tab 2: 📄 Verify → ResumeScreen
Tab 3: 🔗 My Link → MyLinkScreen
Tab 4: 👤 Profile → ProfileScreen
Tab 5: ⚙️ More → MoreScreen (or settings modal)

Tab bar style:
```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

const Tab = createBottomTabNavigator()

<Tab.Navigator
  screenOptions={{
    tabBarStyle: {
      backgroundColor: '#13131A',
      borderTopColor: '#2A2A3A',
      borderTopWidth: 1,
      height: 64,
      paddingBottom: 8,
    },
    tabBarActiveTintColor: '#F5C542',
    tabBarInactiveTintColor: '#9999AA',
    headerShown: false,
  }}
>
  <Tab.Screen name="Home" component={DashboardScreen} />
  <Tab.Screen name="Verify" component={ResumeScreen} />
  <Tab.Screen name="MyLink" component={MyLinkScreen} />
  <Tab.Screen name="Profile" component={ProfileScreen} />
</Tab.Navigator>
```

═══════════════════════════════════
SCREEN 9: src/screens/company/CandidatesScreen.tsx
═══════════════════════════════════

Stats at top (4 metric pills)
Candidate list (FlatList, pull-to-refresh with onRefresh prop)
Each candidate card:
- Avatar + Name + University
- Verification badges row (small colored dots)
- "Police Verified" special badge (gold/yellow if true)
- ATS Score pill
- [Shortlist] + [View Profile] buttons

Filter bottom sheet using Modal (slides up on "Filter" button):
All same filters as website but adapted for mobile:
- Sliders for score ranges
- Switch components for police verified toggle
- University Picker for dropdown

═══════════════════════════════════
NAVIGATION ROOT: src/navigation/RootNavigator.tsx
═══════════════════════════════════
Check stored session in Keychain:
- If session exists + valid → go to role dashboard
- If no session → go to Auth flow

```tsx
import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as Keychain from 'react-native-keychain'
import AuthNavigator from './AuthNavigator'
import StudentNavigator from './StudentNavigator'
import CompanyNavigator from './CompanyNavigator'

const Stack = createNativeStackNavigator()

export default function RootNavigator() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    try {
      const credentials = await Keychain.getGenericPassword()
      if (credentials) {
        const session = JSON.parse(credentials.password)
        setUserRole(session.role)
      }
    } catch (e) {
      setUserRole(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return null // Or a SplashScreen component

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!userRole ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : userRole === 'student' ? (
          <Stack.Screen name="Student" component={StudentNavigator} />
        ) : (
          <Stack.Screen name="Company" component={CompanyNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

═══════════════════════════════════
SUPABASE CLIENT: src/lib/supabase.ts
═══════════════════════════════════
```tsx
import { createClient } from '@supabase/supabase-js'
import Config from 'react-native-config'

export const supabase = createClient(
  Config.SUPABASE_URL!,
  Config.SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: {
        // Custom storage using Keychain for security
        async getItem(key: string) {
          const credentials = await Keychain.getGenericPassword({ service: key })
          return credentials ? credentials.password : null
        },
        async setItem(key: string, value: string) {
          await Keychain.setGenericPassword(key, value, { service: key })
        },
        async removeItem(key: string) {
          await Keychain.resetGenericPassword({ service: key })
        },
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```
```

---

## 📱 Mobile App Manual Steps (Android Studio Ke Saath)

### Step 1 — Java Development Kit (JDK) Install Karo
1. **https://adoptium.net** pe jao → Temurin JDK 17 download karo
2. Install karo default settings ke saath
3. JAVA_HOME environment variable set karo:
   - Windows: Control Panel → System → Advanced → Environment Variables
   - Add new: `JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot`
   - PATH mein add karo: `%JAVA_HOME%\bin`

### Step 2 — Android Studio Install Karo
1. **https://developer.android.com/studio** pe jao
2. Download karo (Windows: `.exe`, Mac: `.dmg`)
3. Install karo with defaults — Android SDK bhi auto-install hoga
4. First launch: "Standard" setup → Next → Finish → SDK downloads hoga (~10-15 min)

### Step 3 — Environment Variables Setup Karo
Windows mein:
```
ANDROID_HOME = C:\Users\[YourName]\AppData\Local\Android\Sdk
PATH mein add karo:
  %ANDROID_HOME%\tools
  %ANDROID_HOME%\tools\bin
  %ANDROID_HOME%\platform-tools
```
Verify karo (new terminal mein):
```bash
adb --version    # Should show version
java -version    # Should show JDK 17
```

### Step 4 — React Native Project Banao
```bash
# Node.js aur npm already installed hona chahiye
node -v    # Check version (v18+ recommended)
npm -v

# React Native CLI se project create karo
npx react-native@latest init CredentiaApp --template react-native-template-typescript
cd CredentiaApp

# Sab packages install karo (Step 1-7 from above prompts)
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
# ... (sab packages as listed above)
```

### Step 5 — Android Virtual Device (AVD) Banao
1. Android Studio open karo
2. Top menu: **Tools → Device Manager**
3. **"Create Device"** button click karo
4. **"Pixel 7"** select karo → **"Next"**
5. System Image: **"Tiramisu (API 33)"** ya **"UpsideDownCake (API 34)"** → Download karo → Next
6. AVD Name: `Pixel_7_API_34` → **Finish**
7. Play button ▶️ click karo — emulator start ho jaayega (~1-2 min)

### Step 6 — App Run Karo (Development/Testing)
```bash
# Terminal 1: Metro bundler start karo
cd CredentiaApp
npx react-native start

# Terminal 2: Android pe run karo
npx react-native run-android
# App emulator/phone pe auto-load ho jaayega!

# Ya Android Studio se bhi run kar sakte ho:
# File → Open → CredentiaApp/android folder open karo
# Green Run button (▶) click karo
```

### Step 7 — .env File Setup Karo
```bash
# CredentiaApp root mein .env file banao:
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
API_URL=https://credentiaonline.in/api
```

### Step 8 — APK Build Karo (Production/Sharing Ke Liye)
```bash
# Android/app/build.gradle mein version check karo
# Release APK build:
cd android
./gradlew assembleRelease

# APK yahan milegi:
# android/app/build/outputs/apk/release/app-release.apk

# Ya Android Studio mein:
# Build → Generate Signed Bundle / APK → APK → Next
# Keystore create karo → Fill details → Finish
# APK file automatically ban jaayegi
```

### Step 9 — Physical Android Phone Pe Install Karo
1. Phone mein **Settings → About Phone** pe jao
2. **"Build Number"** pe 7 baar tap karo → Developer Mode enable hoga
3. **Settings → Developer Options → USB Debugging ON** karo
4. USB cable se connect karo
5. Phone pe "Allow USB Debugging" allow karo
6. Terminal mein: `adb devices` — tumhara device dikhega
7. `npx react-native run-android` — app phone pe install + launch ho jaayegi

### Step 10 — Deep Linking Setup (credentiaonline.in Links App Mein Kholne Ke Liye)
`android/app/src/main/AndroidManifest.xml` mein add karo:
```xml
<activity android:name=".MainActivity">
  <!-- Existing intent filters ... -->
  
  <!-- Deep link for credentiaonline.in/verify/* -->
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
      android:scheme="https"
      android:host="credentiaonline.in"
      android:pathPrefix="/verify" />
  </intent-filter>
</activity>
```

`public/.well-known/assetlinks.json` file banao website project mein:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "in.credentiaonline.app",
    "sha256_cert_fingerprints": ["TUMHARA_KEYSTORE_SHA256_FINGERPRINT"]
  }
}]
```

SHA256 fingerprint kaise milega:
```bash
# Debug keystore ke liye (development):
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Release keystore ke liye:
keytool -list -v -keystore your-release-key.keystore -alias your-alias
```

Ab jab koi `credentiaonline.in/verify/...` link click karega Android pe, app automatically kholega!