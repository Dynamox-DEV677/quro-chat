// ═══ FILE DRAG & DROP ═══
import { handleFileUpload } from './file-upload.js?v=48';

let _dropOverlay = null;

export function initDragDrop() {
  const chatArea = document.getElementById('chatArea');
  if (!chatArea) return;

  // Create drop overlay
  _dropOverlay = document.createElement('div');
  _dropOverlay.id = 'dropOverlay';
  _dropOverlay.className = 'drop-overlay';
  _dropOverlay.innerHTML = '<div class="drop-zone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><div class="drop-text">Drop file to upload</div></div>';
  chatArea.appendChild(_dropOverlay);

  let dragCounter = 0;

  chatArea.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (dragCounter === 1) _dropOverlay.classList.add('show');
  });

  chatArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) _dropOverlay.classList.remove('show');
  });

  chatArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  chatArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    _dropOverlay.classList.remove('show');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // Reuse the existing file upload handler by creating a fake input
      const fakeInput = { files: [files[0]] };
      handleFileUpload(fakeInput);
    }
  });
}
