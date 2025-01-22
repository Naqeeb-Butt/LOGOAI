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

  // Create color buttons with tooltips
  COLORS.forEach(color => {
    const button = document.createElement('button');
    button.className = 'color-btn';
    button.style.backgroundColor = color;
    button.title = color;
    button.onclick = () => toggleSelection('selectedColors', color);
    colorSelection.appendChild(button);
  });

  // Create design buttons
  DESIGNS.forEach(design => {
    const button = document.createElement('button');
    button.className = 'selection-btn';
    button.textContent = design;
    button.onclick = () => toggleSelection('selectedDesigns', design);
    designSelection.appendChild(button);
  });

  // Add event listeners
  companyNameInput.addEventListener('input', updateState);
  sloganInput.addEventListener('input', updateState);
  industrySelect.addEventListener('change', updateState);
  generateBtn.addEventListener('click', generateLogo);
  downloadBtn.addEventListener('click', downloadLogo);
}

// Update state and UI
function updateState(event) {
  const { id, value } = event.target;
  state[id] = value;
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
  if (!state.companyName) {
    alert('Please enter a company name');
    return;
  }
  
  if (state.selectedFonts.length === 0) {
    alert('Please select at least one font');
    return;
  }
  
  if (state.selectedColors.length === 0) {
    alert('Please select at least one color');
    return;
  }

  // Add loading state
  generateBtn.classList.add('loading');
  generateBtn.disabled = true;

  try {
    const response = await fetch('/api/generate-logo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(state)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    
    // Update preview with generated logo
    const previewArea = document.getElementById('previewArea');
    const img = document.createElement('img');
    img.src = data.previewUrl;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    
    previewArea.innerHTML = '';
    previewArea.appendChild(img);

    // Show download button
    downloadArea.style.display = 'block';
    downloadBtn.dataset.logoId = data.id;
    
  } catch (error) {
    alert('Error generating logo: ' + error.message);
  } finally {
    // Remove loading state
    generateBtn.classList.remove('loading');
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

// Initialize the app
init();

// Updated generateLogo function to send data to backend
// Update generateLogo function
async function generateLogo() {
  console.log("Generate button clicked!");

  const companyName = document.getElementById('companyName').value.trim();
  const slogan = document.getElementById('slogan').value.trim();
  const color = document.getElementById('color').value.trim();
  const industry = document.getElementById('industry').value.trim();

  if (!companyName || !color || !industry) {
      const previewArea = document.getElementById('previewArea');
      previewArea.innerHTML = '<p class="error-message">Please fill out all required fields.</p>';
      return;
  }

  const previewArea = document.getElementById('previewArea');
  previewArea.innerHTML = '<p class="loading-message">Generating logo...</p>';

  const generateBtn = document.getElementById('generateBtn');
  generateBtn.disabled = true;
  generateBtn.textContent = 'Generating...';

  try {
      const response = await fetch('/generate-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              inputs: `Logo for '${industry}' with text '${companyName}' and slogan '${slogan}', color '${color}'.`,
          }),
      });

      if (!response.ok) {
          const error = await response.json();
          console.error("Error:", error);
          throw new Error(error.error);
      }

      // Process the generated image blob
      const blob = await response.blob();
      const imgUrl = URL.createObjectURL(blob);

      // Display the image in the preview area
      const img = document.createElement('img');
      img.src = imgUrl;
      img.alt = 'Generated Logo';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';

      previewArea.innerHTML = '';
      previewArea.appendChild(img);

      // Show and configure the download button
      const downloadArea = document.getElementById('downloadArea');
      const downloadBtn = document.getElementById('downloadBtn');
      downloadArea.style.display = 'block'; // Make the button visible
      downloadBtn.onclick = () => {
          const a = document.createElement('a');
          a.href = imgUrl;
          a.download = `${companyName.toLowerCase().replace(/\\s+/g, '-')}-logo.png`;
          a.click();
      };
  } catch (error) {
      console.error("Error occurred:", error.message);
      previewArea.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
  } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate Logo';
  }
}
