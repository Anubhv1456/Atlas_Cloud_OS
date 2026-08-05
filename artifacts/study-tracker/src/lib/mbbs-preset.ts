import { mbbsHierarchy, loadPreset } from './exam-presets';

export { mbbsHierarchy };

export async function loadMBBSPreset() {
  await loadPreset(mbbsHierarchy);
}
