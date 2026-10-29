import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

// Space kept between the focused field and the keyboard, so the button under a
// field (e.g. "Enregistrer") stays visible instead of being covered.
const FIELD_GAP = 96;

// ScrollView that keeps the focused field above the keyboard. Android
// edge-to-edge does not resize the window, so a plain ScrollView or
// KeyboardAvoidingView leaves fields hidden. Use this on every screen with
// text fields.
export default function KeyboardScrollView(props) {
  return <KeyboardAwareScrollView bottomOffset={FIELD_GAP} {...props} />;
}
