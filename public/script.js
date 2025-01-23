const FONTS = [
    'Arial', 'Helvetica', 'Times New Roman', 'Roboto', 
    'Open Sans', 'Montserrat', 'Playfair Display', 'Lato'
];

const COLORS = [
  // Primary Colors
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5',
  // Modern Colors
  '#2D3436', '#636E72', '#00B894', '#00CEC9', '#0984E3', '#6C5CE7',
  // Pastel Colors
  '#FFB6B9', '#FAE3D9', '#BBDED6', '#8AC6D1', '#B8E6CF', '#FFD93D',
  // Corporate Colors
  '#1A237E', '#0D47A1', '#006064', '#004D40', '#1B5E20', '#BF360C'
];

const DESIGNS = ['Minimal', 'Modern', 'Vintage', 'Bold', 'Elegant', 'Playful'];

const INDUSTRIES = [
  // Technology & Digital
  'Technology', 'Software Development', 'Digital Marketing', 'E-commerce', 'Cybersecurity',
  // Business & Finance
  'Finance', 'Consulting', 'Real Estate', 'Insurance', 'Banking',
  // Creative & Media
  'Design Studio', 'Photography', 'Film Production', 'Music & Entertainment', 'Gaming',
  // Health & Wellness
  'Healthcare', 'Fitness', 'Wellness', 'Pharmaceuticals', 'Medical Devices',
  // Food & Hospitality
  'Food & Beverage', 'Restaurant', 'Hotel', 'Catering', 'Coffee Shop',
  // Education & Learning
  'Education', 'E-Learning', 'Training', 'Coaching', 'Research',
  // Retail & Fashion
  'Fashion', 'Retail', 'Luxury Goods', 'Accessories', 'Beauty',
  // Others
  'Manufacturing', 'Construction', 'Transportation', 'Agriculture', 'Non-Profit'
];

// State
const state = {
  companyName: '',
  slogan: '',
  industry: '',
  selectedFonts: [],
  selectedColors: [],
  selectedDesigns: [],
};

// DOM Elements
const companyNameInput = document.getElementById('companyName');
const sloganInput = document.getElementById('slogan');
const industrySelect = document.getElementById('industry');
const fontSelection = document.getElementById('fontSelection');
const colorSelection = document.getElementById('colorSelection');
const designSelection = document.getElementById('designSelection');
const previewArea = document.getElementById('previewArea');
const generateBtn = document.getElementById('generateBtn');
const downloadArea = document.getElementById('downloadArea');
const downloadBtn = document.getElementById('downloadBtn');

// Initialize the app
function init() {
  // Populate industry select
  INDUSTRIES.forEach(industry => {
    const option = document.createElement('option');
    option.value = industry;
    option.textContent = industry;
    industrySelect.appendChild(option);
  });

  // Create font buttons with preview
  FONTS.forEach(font => {
    const button = document.createElement('button');
    button.className = 'selection-btn';
    button.textContent = font;
    button.style.fontFamily = font;
    button.onclick = () => toggleSelection('selectedFonts', font);
    fontSelection.appendChild(button);
  });

  // Create color buttons
  const colorGrid = document.getElementById('colorSelection');
  COLORS.forEach(color => {
    const button = document.createElement('button');
    button.className = 'color-btn';
    button.style.backgroundColor = color;
    button.title = color;
    button.onclick = () => toggleSelection('selectedColors', color);
    colorGrid.appendChild(button);
  });

  // Create design buttons
  DESIGNS.forEach(design => {
    const button = document.createElement('button');
    button.className = 'selection-btn';
    button.textContent = design;
    button.onclick = () => toggleSelection('selectedDesigns', design);
    designSelection.appendChild(button);
  });

  // Update event listeners
  companyNameInput.addEventListener('input', (e) => {
    state.companyName = e.target.value;
  });
  
  sloganInput.addEventListener('input', (e) => {
    state.slogan = e.target.value;
  });
  
  industrySelect.addEventListener('change', (e) => {
    state.industry = e.target.value;
  });

  downloadBtn.addEventListener('click', downloadLogo);
}

// Update state and UI
function updateState(event) {
  const { id, value } = event.target;
  state[id] = value;
  
  // Debug log
  console.log('State updated:', {
    field: id,
    value: value,
    currentState: state
  });

  updatePreview();
}

// Toggle selection for multi-select options
function toggleSelection(field, value) {
  const index = state[field].indexOf(value);
  if (index === -1) {
    if (state[field].length >= 3) {
      alert(`You can only select up to 3 ${field.replace('selected', '')}`);
      return;
    }
    state[field].push(value);
  } else {
    state[field].splice(index, 1);
  }

  // Update UI
  const buttons = document.querySelectorAll(`.${field === 'selectedColors' ? 'color-btn' : 'selection-btn'}`);
  buttons.forEach(button => {
    const buttonValue = button.textContent || button.style.backgroundColor;
    if (state[field].includes(buttonValue)) {
      button.classList.add('selected');
    } else {
      button.classList.remove('selected');
    }
  });

  updatePreview();
}

// Update preview area
function updatePreview() {
  if (state.companyName) {
    const content = document.createElement('div');
    content.className = 'preview-content';
    
    const title = document.createElement('h1');
    title.textContent = state.companyName;
    if (state.selectedFonts.length > 0) {
      title.style.fontFamily = state.selectedFonts[0];
    }
    if (state.selectedColors.length > 0) {
      title.style.color = state.selectedColors[0];
    }
    
    content.appendChild(title);

    if (state.slogan) {
      const slogan = document.createElement('p');
      slogan.textContent = state.slogan;
      if (state.selectedFonts.length > 1) {
        slogan.style.fontFamily = state.selectedFonts[1];
      }
      if (state.selectedColors.length > 1) {
        slogan.style.color = state.selectedColors[1];
      }
      content.appendChild(slogan);
    }

    previewArea.innerHTML = '';
    previewArea.appendChild(content);
  } else {
    previewArea.innerHTML = '<p class="preview-placeholder">Enter company details to preview logo</p>';
  }
}

// Generate logo
async function generateLogo() {
  // Show loading state first
  const loadingMessage = document.createElement('div');
  loadingMessage.className = 'loading-message';
  loadingMessage.textContent = 'Generating your logo...';
  previewArea.innerHTML = '';
  previewArea.appendChild(loadingMessage);
  
  generateBtn.disabled = true;

  try {
    const companyName = document.getElementById('companyName').value.trim();
    const industry = document.getElementById('industry').value;
    const color = document.getElementById('colorInput').value.trim();

    // More specific validation
    if (!companyName) {
      throw new Error('Please enter a company name');
    }
    if (!industry) {
      throw new Error('Please select an industry');
    }
    if (!color) {
      throw new Error('Please enter a color');
    }

    const response = await fetch('/generate-logo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: `Logo for '${industry}' with text '${companyName}' and slogan '${state.slogan || ''}', color '${color}'`
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const blob = await response.blob();
    const imgUrl = URL.createObjectURL(blob);
    
    // Update preview with generated logo
    const img = document.createElement('img');
    img.src = imgUrl;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    
    previewArea.innerHTML = '';
    previewArea.appendChild(img);

    // Show download button
    downloadArea.style.display = 'block';
    downloadBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = imgUrl;
      a.download = `${companyName.toLowerCase().replace(/\s+/g, '-')}-logo.png`;
      a.click();
    };

  } catch (error) {
    // Show error in preview area
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = error.message;
    previewArea.innerHTML = '';
    previewArea.appendChild(errorMessage);
  } finally {
    generateBtn.disabled = false;
  }
}

// Download logo
async function downloadLogo() {
  const logoId = downloadBtn.dataset.logoId;
  if (!logoId) return;

  try {
    const response = await fetch(`/api/logos/${logoId}`);
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.companyName.toLowerCase().replace(/\s+/g, '-')}-logo.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert('Error downloading logo: ' + error.message);
  }
}

// Call init when the page loads
document.addEventListener('DOMContentLoaded', init);
