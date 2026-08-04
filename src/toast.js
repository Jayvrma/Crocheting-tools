let container = null;

const ensureContainer = () => {
  if (container && document.body.contains(container)) {
    return container;
  }
  container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
};

export const showToast = (message, type = 'success', duration = 4000) => {
  const toastContainer = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast-visible'));

  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, duration);
};
