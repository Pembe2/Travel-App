export class TripForm {
  constructor(root, onSubmit) {
    this.root = root;
    this.onSubmit = onSubmit;
    this.errorEl = document.getElementById('inline-error');
    this.render();
  }

  render() {
    const form = document.createElement('form');
    form.setAttribute('aria-label', 'Trip planning form');
    form.innerHTML = `
      <label>
        Destination
        <input type="text" name="destination" required placeholder="City, country" aria-required="true" />
      </label>
      <label>
        Dates
        <div class="meta-grid">
          <input type="date" name="startDate" aria-label="Start date" />
          <input type="date" name="endDate" aria-label="End date" />
        </div>
      </label>
      <label>
        Interests or constraints
        <textarea name="interests" placeholder="Food markets, architecture, parks"></textarea>
      </label>
      <button class="button" type="submit">
        <span class="button-label">Plan my trip</span>
        <span class="spinner" aria-hidden="true" hidden></span>
        <span class="sr-only status-text" aria-live="polite"></span>
      </button>
    `;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.clearError();
      const formData = new FormData(form);
      const destination = (formData.get('destination') || '').toString().trim();
      const startDate = (formData.get('startDate') || '').toString();
      const endDate = (formData.get('endDate') || '').toString();
      const interests = (formData.get('interests') || '').toString();

      if (!destination) {
        this.showError('Please enter a destination.');
        return;
      }

      this.setLoading(true);
      this.onSubmit({
        destination,
        startDate,
        endDate,
        interests,
      });
    });

    this.form = form;
    this.root.innerHTML = '';
    this.root.appendChild(form);
  }

  setLoading(isLoading) {
    const button = this.form.querySelector('button');
    const spinner = this.form.querySelector('.spinner');
    const status = this.form.querySelector('.status-text');
    const label = this.form.querySelector('.button-label');
    button.disabled = isLoading;
    spinner.hidden = !isLoading;
    status.textContent = isLoading ? 'Generating trip plan' : '';
    label.textContent = isLoading ? 'Planning…' : 'Plan my trip';
  }

  showError(message) {
    if (this.errorEl) {
      this.errorEl.textContent = message;
    }
  }

  clearError() {
    if (this.errorEl) {
      this.errorEl.textContent = '';
    }
  }
}
