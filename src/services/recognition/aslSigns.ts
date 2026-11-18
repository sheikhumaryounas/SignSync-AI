import { SignVocabularyItem } from '../../types';

// The 20 ASL signs the Conformer model (server/pipeline/asl20_conformer_face) recognises.
// `label` is the model's class name; the rest is what the app shows for it.
const SIGNS: {
  label: string;
  en: string;
  ur: string;
  category: SignVocabularyItem['category'];
  gesture: SignVocabularyItem['gestureType'];
  descEn: string;
  descUr: string;
}[] = [
  { label: 'bye', en: 'Bye', ur: 'خدا حافظ', category: 'greetings', gesture: 'single_hand', descEn: 'Open hand waves goodbye.', descUr: 'کھلا ہاتھ ہلا کر الوداع کہیں۔' },
  { label: 'callonphone', en: 'Call on phone', ur: 'فون کرنا', category: 'daily', gesture: 'single_hand', descEn: 'Thumb and little finger held to the ear like a phone.', descUr: 'انگوٹھا اور چھوٹی انگلی فون کی طرح کان کے پاس۔' },
  { label: 'drink', en: 'Drink', ur: 'پینا', category: 'daily', gesture: 'single_hand', descEn: 'Curved hand tips towards the mouth like a cup.', descUr: 'مڑا ہوا ہاتھ کپ کی طرح منہ کی طرف۔' },
  { label: 'fine', en: 'Fine', ur: 'ٹھیک', category: 'feelings', gesture: 'single_hand', descEn: 'Thumb of an open hand taps the chest.', descUr: 'کھلے ہاتھ کا انگوٹھا سینے کو چھوتا ہے۔' },
  { label: 'happy', en: 'Happy', ur: 'خوش', category: 'feelings', gesture: 'single_hand', descEn: 'Flat hand brushes up the chest in small circles.', descUr: 'سیدھا ہاتھ سینے پر اوپر کی طرف دائرے میں۔' },
  { label: 'hello', en: 'Hello', ur: 'ہیلو', category: 'greetings', gesture: 'single_hand', descEn: 'Flat hand moves out from the forehead like a salute.', descUr: 'سیدھا ہاتھ ماتھے سے باہر کی طرف، سلامی کی طرح۔' },
  { label: 'home', en: 'Home', ur: 'گھر', category: 'daily', gesture: 'single_hand', descEn: 'Fingertips touch the cheek near the mouth, then near the ear.', descUr: 'انگلیوں کے سرے منہ کے پاس، پھر کان کے پاس گال کو چھوتے ہیں۔' },
  { label: 'hungry', en: 'Hungry', ur: 'بھوک', category: 'daily', gesture: 'single_hand', descEn: 'Curved hand moves down the chest.', descUr: 'مڑا ہوا ہاتھ سینے پر نیچے کی طرف۔' },
  { label: 'no', en: 'No', ur: 'نہیں', category: 'questions', gesture: 'single_hand', descEn: 'Index and middle finger snap against the thumb.', descUr: 'شہادت اور درمیانی انگلی انگوٹھے سے ملتی ہیں۔' },
  { label: 'please', en: 'Please', ur: 'براہ کرم', category: 'greetings', gesture: 'single_hand', descEn: 'Flat hand circles on the chest.', descUr: 'سیدھا ہاتھ سینے پر دائرے میں۔' },
  { label: 'sad', en: 'Sad', ur: 'اداس', category: 'feelings', gesture: 'two_hand', descEn: 'Open hands move down in front of the face.', descUr: 'کھلے ہاتھ چہرے کے سامنے نیچے کی طرف۔' },
  { label: 'see', en: 'See', ur: 'دیکھنا', category: 'daily', gesture: 'single_hand', descEn: 'V-shape fingers move out from the eyes.', descUr: 'وی شکل کی انگلیاں آنکھوں سے باہر کی طرف۔' },
  { label: 'sick', en: 'Sick', ur: 'بیمار', category: 'medical', gesture: 'single_hand', descEn: 'Middle finger touches the forehead.', descUr: 'درمیانی انگلی ماتھے کو چھوتی ہے۔' },
  { label: 'sleep', en: 'Sleep', ur: 'سونا', category: 'daily', gesture: 'single_hand', descEn: 'Open hand closes as it moves down over the face.', descUr: 'کھلا ہاتھ چہرے پر نیچے آتے ہوئے بند ہوتا ہے۔' },
  { label: 'thankyou', en: 'Thank you', ur: 'شکریہ', category: 'greetings', gesture: 'single_hand', descEn: 'Fingertips touch the chin, then move forward.', descUr: 'انگلیوں کے سرے ٹھوڑی کو چھو کر آگے بڑھتے ہیں۔' },
  { label: 'time', en: 'Time', ur: 'وقت', category: 'questions', gesture: 'two_hand', descEn: 'Index finger taps the back of the other wrist.', descUr: 'شہادت کی انگلی دوسری کلائی کی پشت پر۔' },
  { label: 'wait', en: 'Wait', ur: 'انتظار', category: 'daily', gesture: 'two_hand', descEn: 'Both hands raised, fingers wiggling.', descUr: 'دونوں ہاتھ اوپر، انگلیاں ہلتی ہوئی۔' },
  { label: 'water', en: 'Water', ur: 'پانی', category: 'daily', gesture: 'single_hand', descEn: 'W-hand taps the chin.', descUr: 'ڈبلیو شکل کا ہاتھ ٹھوڑی کو چھوتا ہے۔' },
  { label: 'where', en: 'Where', ur: 'کہاں', category: 'questions', gesture: 'single_hand', descEn: 'Index finger shakes side to side.', descUr: 'شہادت کی انگلی دائیں بائیں ہلتی ہے۔' },
  { label: 'yes', en: 'Yes', ur: 'ہاں', category: 'questions', gesture: 'single_hand', descEn: 'Fist nods up and down.', descUr: 'مٹھی اوپر نیچے ہلتی ہے۔' },
];

export const ASL_SIGNS: SignVocabularyItem[] = SIGNS.map((s) => ({
  id: `asl_${s.label}`,
  signNameEnglish: s.en,
  signNameUrdu: s.ur,
  category: s.category,
  sampleCount: 0,
  status: 'active',
  descriptionEnglish: s.descEn,
  descriptionUrdu: s.descUr,
  gestureType: s.gesture,
  landmarkCount: 165,
  confidenceAverage: 0.85,
}));

const byLabel = new Map(SIGNS.map((s, i) => [s.label, ASL_SIGNS[i]]));

/** The app's sign for a model class name, or undefined for a label this app version does not know. */
export const aslSign = (label: string): SignVocabularyItem | undefined => byLabel.get(label);
