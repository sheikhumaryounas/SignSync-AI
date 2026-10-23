import { OutputLanguage, UserRole } from '../../../types';
import { defaultSettingsFor, hasFeedbackChannel, PreferencesApi } from '../preferences';
import { ApiError, PreferenceProfile, Preferences, PreferenceSettings } from '../types';
import { delay, newId, readJson, roleOfUser, userIdFromToken, writeJson } from './store';

const prefsKey = (uid: string) => `signsync.mock.prefs.${uid}`;
const profilesKey = (uid: string) => `signsync.mock.profiles.${uid}`;
const stamp = (s: PreferenceSettings): Preferences => ({ ...s, updatedAt: new Date().toISOString() });

// Called by the mock register flow, like the backend creating preferences in the same transaction.
export async function seedPreferences(userId: string, role: UserRole, outputLanguage: OutputLanguage) {
  await writeJson(prefsKey(userId), stamp({ ...defaultSettingsFor(role), outputLanguage }));
}

function validate(s: PreferenceSettings) {
  if (!hasFeedbackChannel(s)) {
    throw new ApiError('validation', 'Keep at least one feedback channel on.', { field: 'feedback', validation: 'no_feedback_channel' });
  }
}

export const mockPreferences: PreferencesApi = {
  async get(token) {
    await delay(200);
    const uid = userIdFromToken(token);
    const stored = await readJson<Preferences>(prefsKey(uid));
    if (stored) return stored;
    const created = stamp(defaultSettingsFor(await roleOfUser(uid)));
    await writeJson(prefsKey(uid), created);
    return created;
  },

  async update(token, settings) {
    await delay();
    const uid = userIdFromToken(token);
    validate(settings);
    const saved = stamp(settings);
    await writeJson(prefsKey(uid), saved);
    return saved;
  },

  async listProfiles(token) {
    await delay(200);
    const uid = userIdFromToken(token);
    const stored = await readJson<PreferenceProfile[]>(profilesKey(uid));
    if (stored) return stored;
    // Two starter profiles so the feature is discoverable (EUC8 step 5).
    const starter: PreferenceProfile[] = [
      {
        id: newId('prof'),
        name: 'Clinic visit',
        createdAt: new Date().toISOString(),
        settings: { outputLanguage: 'urdu', visualFeedback: true, audioFeedback: true, hapticFeedback: true, fontSize: 'large' },
      },
      {
        id: newId('prof'),
        name: 'Classroom',
        createdAt: new Date().toISOString(),
        settings: { outputLanguage: 'english', visualFeedback: true, audioFeedback: false, hapticFeedback: true, fontSize: 'normal' },
      },
    ];
    await writeJson(profilesKey(uid), starter);
    return starter;
  },

  async createProfile(token, name, settings) {
    await delay();
    const uid = userIdFromToken(token);
    validate(settings);
    const clean = name.trim();
    if (!clean) throw new ApiError('validation', 'Give the profile a name.', { field: 'name', validation: 'profile_name_required' });
    const list = await this.listProfiles(token);
    if (list.some((p) => p.name.toLowerCase() === clean.toLowerCase())) {
      throw new ApiError('validation', 'A profile with this name already exists.', { field: 'name', validation: 'profile_name_taken' });
    }
    const profile: PreferenceProfile = { id: newId('prof'), name: clean, settings, createdAt: new Date().toISOString() };
    await writeJson(profilesKey(uid), [...list, profile]);
    return profile;
  },

  async deleteProfile(token, id) {
    await delay(200);
    const uid = userIdFromToken(token);
    const list = (await readJson<PreferenceProfile[]>(profilesKey(uid))) ?? [];
    await writeJson(profilesKey(uid), list.filter((p) => p.id !== id));
  },
};
