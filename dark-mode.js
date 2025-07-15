
// Dark mode toggle functionality
class DarkModeToggle {
  constructor() {
    this.toggleButton = document.getElementById('dark-mode-toggle');
    this.currentTheme = localStorage.getItem('theme') || 'dark';
    
    this.init();
  }

  init() {
    // Set initial theme
    this.applyTheme(this.currentTheme);
    
    // Add event listener
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => this.toggle());
    }
  }

  toggle() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(this.currentTheme);
    localStorage.setItem('theme', this.currentTheme);
  }

  applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      if (this.toggleButton) {
        this.toggleButton.textContent = '☀️';
        this.toggleButton.title = 'Switch to dark mode';
      }
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (this.toggleButton) {
        this.toggleButton.textContent = '🌙';
        this.toggleButton.title = 'Switch to light mode';
      }
    }
  }
}

// Initialize dark mode toggle when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DarkModeToggle();
});
