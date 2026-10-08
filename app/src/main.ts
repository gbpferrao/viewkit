import { createApp } from 'vue';
import { createPinia } from 'pinia';
import EditorView from './editor.view.vue';
import './editor.css';
import './interface/design-system.css';
import { useProject } from './timeline/project-timeline.state';
import { restoreStoredProject } from './timeline/project-storage.resource';
async function start() {
  const pinia = createPinia();
  await restoreStoredProject(useProject(pinia));
  createApp(EditorView).use(pinia).mount('#app');
}
void start();

