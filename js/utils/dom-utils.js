export class DOMUtils {
  static addEventListenerWithValidation(element, event, handler, options = {}) {
    if (!element || typeof handler !== 'function') {
      console.error('Invalid element or handler for event listener');
      return;
    }

    const wrappedHandler = (e) => {
      try {
        handler(e);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    };

    element.addEventListener(event, wrappedHandler, options);
    return wrappedHandler;
  }

  static fadeIn(element, duration = 300) {
    if (!element) return Promise.resolve();

    return new Promise((resolve) => {
      element.style.opacity = '0';
      element.style.display = 'block';
      element.style.transition = `opacity ${duration}ms ease-in-out`;

      element.offsetHeight;

      element.style.opacity = '1';

      setTimeout(() => {
        element.style.transition = '';
        resolve();
      }, duration);
    });
  }

  static fadeOut(element, duration = 300) {
    if (!element) return Promise.resolve();

    return new Promise((resolve) => {
      element.style.transition = `opacity ${duration}ms ease-in-out`;
      element.style.opacity = '0';

      setTimeout(() => {
        element.style.display = 'none';
        element.style.transition = '';
        element.style.opacity = '';
        resolve();
      }, duration);
    });
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static scrollToElement(element, behavior = 'smooth') {
    if (!element) return;

    element.scrollIntoView({
      behavior,
      block: 'start',
      inline: 'nearest'
    });
  }

  static showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('toast-show'), 100);

    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);

    return toast;
  }
}