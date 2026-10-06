(() => {
  const dialog = document.getElementById('figure-dialog');
  const zoomImage = document.getElementById('zoom-image');
  const zoomTitle = document.getElementById('zoom-title');
  document.querySelectorAll('.figure-open').forEach(button => {
    button.addEventListener('click', () => {
      zoomImage.src = button.dataset.image;
      zoomImage.alt = button.querySelector('img').alt;
      zoomTitle.textContent = button.dataset.caption;
      dialog.showModal();
    });
  });
  document.getElementById('close-figure').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  document.getElementById('copy-citation').addEventListener('click', async () => {
    const text = document.getElementById('bibtex').textContent;
    const status = document.getElementById('copy-status');
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'BibTeX copied.';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(document.getElementById('bibtex'));
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Citation selected. Copy it, or download the .bib file.';
    }
  });
})();

