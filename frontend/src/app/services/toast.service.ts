import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private container: HTMLElement | null = null;

  private initContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  show(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, duration = 4000) {
    this.initContainer();

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    let iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-xmark';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';
    if (type === 'info') iconClass = 'fa-circle-info';

    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fa-solid ${iconClass}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-title">${title || (type === 'success' ? 'Succès' : 'Information')}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    toast.querySelector('.toast-close')?.addEventListener('click', () => toast.remove());

    if (this.container) {
      this.container.appendChild(toast);
    }

    if (duration > 0) {
      setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  }

  success(message: string, title = 'Succès') {
    this.show('success', title, message);
  }

  error(message: string, title = 'Erreur') {
    this.show('error', title, message);
  }

  info(message: string, title = 'Information') {
    this.show('info', title, message);
  }

  warning(message: string, title = 'Attention') {
    this.show('warning', title, message);
  }
}
