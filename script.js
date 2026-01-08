// Get DOM elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const analyzeBtn = document.getElementById('analyzeBtn');
const analyzeFileBtn = document.getElementById('analyzeFileBtn');
const textInput = document.getElementById('textInput');
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const fileInfo = document.getElementById('fileInfo');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');
const loadingPopup = document.getElementById('loadingPopup');

const summaryEl = document.getElementById('summary');
const keywordsEl = document.getElementById('keywords');
const sentimentEl = document.getElementById('sentiment');
const languageEl = document.getElementById('language');
const wordCountEl = document.getElementById('wordCount');
const downloadReportBtn = document.getElementById('downloadReportBtn');

let uploadedFile = null;
let currentAnalysisResult = null;

// Tab Switching
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(tab + 'Tab').classList.add('active');
  });
});

// File Upload - Browse
fileInput.addEventListener('change', (e) => {
  handleFile(e.target.files[0]);
});

// File Upload - Drag & Drop
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  handleFile(e.dataTransfer.files[0]);
});

uploadArea.addEventListener('click', () => {
  fileInput.click();
});

// Handle File
function handleFile(file) {
  if (!file) return;
  
  const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!validTypes.includes(file.type)) {
    showNotification('❌ Please upload a PDF or DOCX file!');
    fileInput.value = ''; // Reset input
    return;
  }
  
  if (file.size > maxSize) {
    showNotification('❌ File size must be less than 10MB!');
    fileInput.value = ''; // Reset input
    return;
  }
  
  uploadedFile = file;
  fileInfo.innerHTML = `📎 <strong>${file.name}</strong> (${(file.size / 1024).toFixed(2)} KB)`;
  fileInfo.classList.add('show');
  analyzeFileBtn.style.display = 'block';
  showNotification('✅ File uploaded successfully!');
}

// Read PDF File
async function readPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    text += pageText + ' ';
  }
  
  return text;
}

// Read DOCX File
async function readDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// Show Notification
function showNotification(message) {
  notificationText.textContent = message;
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// Show Loading
function showLoading(show) {
  if (show) {
    loadingPopup.classList.add('show');
  } else {
    loadingPopup.classList.remove('show');
  }
}

// Detect Language - Comprehensive detection for 100+ languages
function detectLanguage(text) {
  if (!text || text.trim().length === 0) return 'Unknown';
  
  const cleanText = text.replace(/[0-9.,!?;:()\[\]{}'"]/g, '');
  const lowerText = text.toLowerCase();
  
  // Count characters from different language scripts
  const scriptCounts = {};
  
  for (let char of cleanText) {
    const code = char.charCodeAt(0);
    
    // Skip whitespace
    if (code === 0x0020 || code === 0x00A0) continue;
    
    // Latin Extended (A-Z, accented characters)
    if ((code >= 0x0041 && code <= 0x007A) || (code >= 0x00C0 && code <= 0x024F)) {
      scriptCounts.latin = (scriptCounts.latin || 0) + 1;
    }
    // Arabic (+ Farsi, Urdu)
    else if ((code >= 0x0600 && code <= 0x06FF) || (code >= 0x0750 && code <= 0x077F) || (code >= 0xFB50 && code <= 0xFDFF) || (code >= 0xFE70 && code <= 0xFEFF)) {
      scriptCounts.arabic = (scriptCounts.arabic || 0) + 1;
    }
    // Devanagari (Hindi, Sanskrit, Marathi, Nepali)
    else if (code >= 0x0900 && code <= 0x097F) {
      scriptCounts.devanagari = (scriptCounts.devanagari || 0) + 1;
    }
    // Bengali (Bangla, Assamese)
    else if (code >= 0x0980 && code <= 0x09FF) {
      scriptCounts.bengali = (scriptCounts.bengali || 0) + 1;
    }
    // Gurmukhi (Punjabi)
    else if (code >= 0x0A00 && code <= 0x0A7F) {
      scriptCounts.gurmukhi = (scriptCounts.gurmukhi || 0) + 1;
    }
    // Gujarati
    else if (code >= 0x0A80 && code <= 0x0AFF) {
      scriptCounts.gujarati = (scriptCounts.gujarati || 0) + 1;
    }
    // Oriya (Odia)
    else if (code >= 0x0B00 && code <= 0x0B7F) {
      scriptCounts.oriya = (scriptCounts.oriya || 0) + 1;
    }
    // Tamil
    else if (code >= 0x0B80 && code <= 0x0BFF) {
      scriptCounts.tamil = (scriptCounts.tamil || 0) + 1;
    }
    // Telugu
    else if (code >= 0x0C00 && code <= 0x0C7F) {
      scriptCounts.telugu = (scriptCounts.telugu || 0) + 1;
    }
    // Kannada
    else if (code >= 0x0C80 && code <= 0x0CFF) {
      scriptCounts.kannada = (scriptCounts.kannada || 0) + 1;
    }
    // Malayalam
    else if (code >= 0x0D00 && code <= 0x0D7F) {
      scriptCounts.malayalam = (scriptCounts.malayalam || 0) + 1;
    }
    // Sinhala (Sri Lanka)
    else if (code >= 0x0D80 && code <= 0x0DFF) {
      scriptCounts.sinhala = (scriptCounts.sinhala || 0) + 1;
    }
    // Thai
    else if (code >= 0x0E00 && code <= 0x0E7F) {
      scriptCounts.thai = (scriptCounts.thai || 0) + 1;
    }
    // Lao
    else if (code >= 0x0E80 && code <= 0x0EFF) {
      scriptCounts.lao = (scriptCounts.lao || 0) + 1;
    }
    // Tibetan
    else if (code >= 0x0F00 && code <= 0x0FFF) {
      scriptCounts.tibetan = (scriptCounts.tibetan || 0) + 1;
    }
    // Myanmar (Burmese)
    else if (code >= 0x1000 && code <= 0x109F) {
      scriptCounts.myanmar = (scriptCounts.myanmar || 0) + 1;
    }
    // Georgian
    else if (code >= 0x10A0 && code <= 0x10FF) {
      scriptCounts.georgian = (scriptCounts.georgian || 0) + 1;
    }
    // Korean (Hangul)
    else if ((code >= 0xAC00 && code <= 0xD7AF) || (code >= 0x1100 && code <= 0x11FF) || (code >= 0x3130 && code <= 0x318F)) {
      scriptCounts.korean = (scriptCounts.korean || 0) + 1;
    }
    // Ethiopic (Amharic, Tigrinya)
    else if (code >= 0x1200 && code <= 0x137F) {
      scriptCounts.ethiopic = (scriptCounts.ethiopic || 0) + 1;
    }
    // Cherokee
    else if (code >= 0x13A0 && code <= 0x13FF) {
      scriptCounts.cherokee = (scriptCounts.cherokee || 0) + 1;
    }
    // Khmer (Cambodian)
    else if (code >= 0x1780 && code <= 0x17FF) {
      scriptCounts.khmer = (scriptCounts.khmer || 0) + 1;
    }
    // Mongolian
    else if (code >= 0x1800 && code <= 0x18AF) {
      scriptCounts.mongolian = (scriptCounts.mongolian || 0) + 1;
    }
    // Greek
    else if (code >= 0x0370 && code <= 0x03FF) {
      scriptCounts.greek = (scriptCounts.greek || 0) + 1;
    }
    // Cyrillic (Russian, Ukrainian, Bulgarian, Serbian, etc.)
    else if (code >= 0x0400 && code <= 0x04FF) {
      scriptCounts.cyrillic = (scriptCounts.cyrillic || 0) + 1;
    }
    // Armenian
    else if (code >= 0x0530 && code <= 0x058F) {
      scriptCounts.armenian = (scriptCounts.armenian || 0) + 1;
    }
    // Hebrew
    else if (code >= 0x0590 && code <= 0x05FF) {
      scriptCounts.hebrew = (scriptCounts.hebrew || 0) + 1;
    }
    // Japanese (Hiragana)
    else if (code >= 0x3040 && code <= 0x309F) {
      scriptCounts.hiragana = (scriptCounts.hiragana || 0) + 1;
    }
    // Japanese (Katakana)
    else if (code >= 0x30A0 && code <= 0x30FF) {
      scriptCounts.katakana = (scriptCounts.katakana || 0) + 1;
    }
    // CJK Unified Ideographs (Chinese/Japanese Kanji)
    else if ((code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3400 && code <= 0x4DBF)) {
      scriptCounts.cjk = (scriptCounts.cjk || 0) + 1;
    }
  }
  
  // Detect Japanese (has Hiragana or Katakana)
  if (scriptCounts.hiragana || scriptCounts.katakana) {
    return 'Japanese (日本語)';
  }
  
  // Detect Korean
  if (scriptCounts.korean) {
    return 'Korean (한국어)';
  }
  
  // Detect Chinese (CJK without Japanese scripts)
  if (scriptCounts.cjk && !scriptCounts.hiragana && !scriptCounts.katakana) {
    return 'Chinese (中文)';
  }
  
  // Detect other scripts
  const scriptMap = {
    arabic: 'Arabic (العربية)',
    devanagari: 'Hindi (हिन्दी)',
    bengali: 'Bengali (বাংলা)',
    gurmukhi: 'Punjabi (ਪੰਜਾਬੀ)',
    gujarati: 'Gujarati (ગુજરાતી)',
    oriya: 'Odia (ଓଡ଼ିଆ)',
    tamil: 'Tamil (தமிழ்)',
    telugu: 'Telugu (తెలుగు)',
    kannada: 'Kannada (ಕನ್ನಡ)',
    malayalam: 'Malayalam (മലയാളം)',
    sinhala: 'Sinhala (සිංහල)',
    thai: 'Thai (ไทย)',
    lao: 'Lao (ລາວ)',
    tibetan: 'Tibetan (བོད་ཡིག)',
    myanmar: 'Burmese (မြန်မာဘာသာ)',
    georgian: 'Georgian (ქართული)',
    ethiopic: 'Amharic (አማርኛ)',
    cherokee: 'Cherokee (ᏣᎳᎩ)',
    khmer: 'Khmer (ខ្មែរ)',
    mongolian: 'Mongolian (Монгол)',
    greek: 'Greek (Ελληνικά)',
    cyrillic: detectCyrillicLanguage(lowerText),
    armenian: 'Armenian (Հայերեն)',
    hebrew: 'Hebrew (עברית)'
  };
  
  // Find dominant script
  let maxCount = 0;
  let detectedScript = null;
  
  for (let [script, count] of Object.entries(scriptCounts)) {
    if (count > maxCount) {
      maxCount = count;
      detectedScript = script;
    }
  }
  
  if (detectedScript && scriptMap[detectedScript]) {
    return scriptMap[detectedScript];
  }
  
  // For Latin script, try to detect specific language
  if (detectedScript === 'latin') {
    return detectLatinLanguage(lowerText);
  }
  
  return 'Unknown';
}

// Detect specific Cyrillic language
function detectCyrillicLanguage(text) {
  const russianWords = ['это', 'как', 'что', 'или', 'для', 'его', 'был', 'она', 'это'];
  const ukrainianWords = ['це', 'або', 'його', 'був', 'вона', 'їх', 'який'];
  const bulgarianWords = ['това', 'или', 'като', 'който', 'беше'];
  
  let ruCount = 0, ukCount = 0, bgCount = 0;
  
  russianWords.forEach(w => { if (text.includes(w)) ruCount++; });
  ukrainianWords.forEach(w => { if (text.includes(w)) ukCount++; });
  bulgarianWords.forEach(w => { if (text.includes(w)) bgCount++; });
  
  if (ukCount > ruCount && ukCount > bgCount) return 'Ukrainian (Українська)';
  if (bgCount > ruCount && bgCount > ukCount) return 'Bulgarian (Български)';
  return 'Russian (Русский)';
}

// Detect specific Latin-based language
function detectLatinLanguage(text) {
  // Common words for language detection
  const patterns = {
    spanish: ['el', 'la', 'de', 'que', 'y', 'es', 'en', 'los', 'se', 'por', 'con', 'para', 'una', 'está', 'como', 'su', 'al'],
    french: ['le', 'de', 'un', 'et', 'être', 'à', 'il', 'avoir', 'ne', 'je', 'son', 'que', 'se', 'qui', 'ce', 'dans', 'en', 'du', 'elle', 'au', 'pour', 'pas', 'sur'],
    german: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als', 'auch', 'es', 'an', 'werden', 'aus'],
    italian: ['il', 'di', 'che', 'è', 'la', 'per', 'un', 'non', 'in', 'sono', 'mi', 'ho', 'lo', 'ma', 'del', 'della', 'una', 'dei', 'delle'],
    portuguese: ['o', 'de', 'que', 'e', 'a', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como'],
    dutch: ['de', 'het', 'een', 'van', 'in', 'en', 'is', 'op', 'te', 'dat', 'voor', 'met', 'zijn', 'die', 'aan', 'er', 'niet', 'om'],
    swedish: ['och', 'i', 'att', 'det', 'som', 'en', 'på', 'är', 'av', 'för', 'den', 'till', 'har', 'de', 'med', 'var'],
    norwegian: ['og', 'i', 'det', 'er', 'en', 'til', 'som', 'på', 'for', 'med', 'av', 'har', 'de', 'at', 'den'],
    danish: ['og', 'i', 'det', 'at', 'en', 'er', 'til', 'som', 'på', 'de', 'med', 'for', 'den', 'af', 'har'],
    polish: ['w', 'i', 'na', 'z', 'o', 'do', 'nie', 'się', 'to', 'że', 'jest', 'po', 'ze', 'od', 'dla', 'oraz'],
    turkish: ['bir', 've', 'bu', 'da', 'ile', 'için', 'mi', 'ne', 'var', 'daha', 'çok', 'o', 'kadar', 'de', 'ben'],
    indonesian: ['yang', 'dan', 'di', 'ini', 'itu', 'untuk', 'dengan', 'pada', 'adalah', 'dari', 'ke', 'akan', 'oleh', 'telah'],
    malay: ['yang', 'dan', 'di', 'ini', 'itu', 'untuk', 'dengan', 'pada', 'adalah', 'daripada', 'ke', 'akan', 'oleh', 'telah'],
    vietnamese: ['và', 'của', 'có', 'là', 'trong', 'được', 'các', 'để', 'cho', 'một', 'với', 'không', 'đã', 'này'],
    tagalog: ['ang', 'ng', 'sa', 'na', 'ay', 'mga', 'at', 'para', 'ito', 'ko', 'mo', 'ako', 'siya'],
    swahili: ['na', 'ya', 'wa', 'kwa', 'ni', 'la', 'katika', 'kama', 'au', 'cha', 'za'],
    romanian: ['și', 'de', 'cu', 'la', 'în', 'pe', 'pentru', 'ca', 'cel', 'din', 'este', 'care', 'să', 'mai', 'ce'],
    czech: ['a', 'v', 'se', 'na', 'je', 'to', 'z', 'o', 's', 'do', 'pro', 'za', 'po', 'že', 'k'],
    finnish: ['ja', 'on', 'ei', 'se', 'että', 'oli', 'olla', 'hän', 'kuin', 'kun', 'voi', 'niin', 'tämä'],
    hungarian: ['a', 'az', 'és', 'van', 'hogy', 'nem', 'is', 'meg', 'egy', 'mint', 'ez', 'el', 'volt']
  };
  
  const scores = {};
  
  // Count matches for each language
  for (let [lang, words] of Object.entries(patterns)) {
    scores[lang] = 0;
    for (let word of words) {
      const regex = new RegExp('\\b' + word + '\\b', 'g');
      const matches = text.match(regex);
      if (matches) {
        scores[lang] += matches.length;
      }
    }
  }
  
  // Find language with highest score
  let maxScore = 0;
  let detectedLang = 'English';
  
  for (let [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang.charAt(0).toUpperCase() + lang.slice(1);
    }
  }
  
  // If no clear match, default to English
  if (maxScore === 0) return 'English';
  
  // Return with native script
  const nativeNames = {
    Spanish: 'Spanish (Español)',
    French: 'French (Français)',
    German: 'German (Deutsch)',
    Italian: 'Italian (Italiano)',
    Portuguese: 'Portuguese (Português)',
    Dutch: 'Dutch (Nederlands)',
    Swedish: 'Swedish (Svenska)',
    Norwegian: 'Norwegian (Norsk)',
    Danish: 'Danish (Dansk)',
    Polish: 'Polish (Polski)',
    Turkish: 'Turkish (Türkçe)',
    Indonesian: 'Indonesian (Bahasa Indonesia)',
    Malay: 'Malay (Bahasa Melayu)',
    Vietnamese: 'Vietnamese (Tiếng Việt)',
    Tagalog: 'Tagalog (Filipino)',
    Swahili: 'Swahili (Kiswahili)',
    Romanian: 'Romanian (Română)',
    Czech: 'Czech (Čeština)',
    Finnish: 'Finnish (Suomi)',
    Hungarian: 'Hungarian (Magyar)'
  };
  
  return nativeNames[detectedLang] || detectedLang;
}

// Demo client-side analyzer
function performDemoAnalysis(text) {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const word_count = words.length;

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let summary = sentences.slice(0, 3).join(' ').substring(0, 200);
  if (summary.length >= 200) summary += '...';

  const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','as','is','was','are','were','been','be','have','has','had','this','that','which','who','will','would','could','should']);
  const wordFreq = {};
  words.forEach(w => {
    const clean = w.toLowerCase().replace(/[^a-z]/g,'');
    if (clean.length > 3 && !stopWords.has(clean)) {
      wordFreq[clean] = (wordFreq[clean] || 0) + 1;
    }
  });
  const keywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k]) => k);

  const positiveWords = ['good','great','excellent','amazing','wonderful','fantastic','happy','love','joy','beautiful','awesome','perfect','best','brilliant'];
  const negativeWords = ['bad','terrible','awful','horrible','sad','hate','worst','angry','disgusting','poor','disappointing','unfortunate'];
  let pos = 0, neg = 0;
  const lowerText = text.toLowerCase();
  positiveWords.forEach(w => {
    if (lowerText.includes(w)) pos++;
  });
  negativeWords.forEach(w => {
    if (lowerText.includes(w)) neg++;
  });
  let sentiment = 'Neutral';
  if (pos > neg) sentiment = 'Positive';
  else if (neg > pos) sentiment = 'Negative';

  const language = detectLanguage(text);
  
  return { summary, keywords, sentiment, language, word_count };
}

// Display Results
function displayResults(result) {
  currentAnalysisResult = result;
  
  summaryEl.textContent = result.summary;
  
  keywordsEl.innerHTML = '';
  result.keywords.forEach((keyword, index) => {
    setTimeout(() => {
      const li = document.createElement('li');
      li.textContent = keyword;
      keywordsEl.appendChild(li);
    }, index * 100);
  });
  
  sentimentEl.textContent = result.sentiment;
  sentimentEl.className = 'sentiment-badge ' + result.sentiment.toLowerCase();
  
  languageEl.textContent = result.language;
  wordCountEl.textContent = result.word_count.toString();
  
  // Show download button
  downloadReportBtn.style.display = 'flex';
  
  // Scroll to results
  document.getElementById('resultsSection').scrollIntoView({ 
    behavior: 'smooth', 
    block: 'start' 
  });
}

// Analyze Text Button
analyzeBtn.addEventListener('click', async () => {
  const text = textInput.value.trim();
  if (!text) {
    showNotification('⚠️ Please enter some text!');
    return;
  }
  
  showLoading(true);
  
  setTimeout(() => {
    const result = performDemoAnalysis(text);
    displayResults(result);
    showLoading(false);
    showNotification('✅ Analysis complete!');
  }, 1500);
});

// Analyze File Button
analyzeFileBtn.addEventListener('click', async () => {
  if (!uploadedFile) {
    showNotification('⚠️ Please upload a file first!');
    return;
  }
  
  showLoading(true);
  
  try {
    let text = '';
    
    if (uploadedFile.type === 'application/pdf') {
      text = await readPDF(uploadedFile);
    } else if (uploadedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = await readDOCX(uploadedFile);
    }
    
    if (!text || text.trim().length === 0) {
      showLoading(false);
      showNotification('❌ Could not extract text from file!');
      return;
    }
    
    const result = performDemoAnalysis(text);
    displayResults(result);
    showLoading(false);
    showNotification('✅ Analysis complete!');
    
    // Reset for next upload
    uploadedFile = null;
    fileInput.value = '';
    fileInfo.classList.remove('show');
    analyzeFileBtn.style.display = 'none';
    
  } catch (error) {
    showLoading(false);
    showNotification('❌ Error processing file: ' + error.message);
    console.error('File processing error:', error);
    
    // Reset on error
    uploadedFile = null;
    fileInput.value = '';
    fileInfo.classList.remove('show');
    analyzeFileBtn.style.display = 'none';
  }
});

// Download Report Button
downloadReportBtn.addEventListener('click', () => {
  if (!currentAnalysisResult) {
    showNotification('⚠️ No analysis data to download!');
    return;
  }
  
  generatePDFReport(currentAnalysisResult);
});

// Generate Professional PDF Report
function generatePDFReport(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = 20;
  
  // Header with gradient effect (simulated with rectangles)
  doc.setFillColor(102, 126, 234);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('DOCUMENT ANALYSIS REPORT', pageWidth / 2, 25, { align: 'center' });
  
  yPos = 50;
  
  // Generated Date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text('Generated on: ' + currentDate, margin, yPos);
  
  yPos += 15;
  
  // Separator line
  doc.setDrawColor(102, 126, 234);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 15;
  
  // Summary Section
  doc.setFontSize(16);
  doc.setTextColor(102, 126, 234);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY', margin, yPos);
  
  yPos += 8;
  
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  const summaryLines = doc.splitTextToSize(data.summary, pageWidth - 2 * margin);
  doc.text(summaryLines, margin, yPos);
  
  yPos += summaryLines.length * 6 + 10;
  
  // Keywords Section
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(16);
  doc.setTextColor(102, 126, 234);
  doc.setFont('helvetica', 'bold');
  doc.text('KEYWORDS', margin, yPos);
  
  yPos += 8;
  
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  
  // Display keywords as badges
  let xPos = margin;
  data.keywords.forEach((keyword, index) => {
    const keywordWidth = doc.getTextWidth(keyword) + 8;
    
    if (xPos + keywordWidth > pageWidth - margin) {
      xPos = margin;
      yPos += 12;
    }
    
    // Keyword background
    doc.setFillColor(102, 126, 234);
    doc.roundedRect(xPos, yPos - 5, keywordWidth, 8, 2, 2, 'F');
    
    // Keyword text
    doc.setTextColor(255, 255, 255);
    doc.text(keyword, xPos + 4, yPos);
    
    xPos += keywordWidth + 5;
  });
  
  yPos += 20;
  
  // Statistics Section
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(16);
  doc.setTextColor(102, 126, 234);
  doc.setFont('helvetica', 'bold');
  doc.text('STATISTICS', margin, yPos);
  
  yPos += 10;
  
  // Create a table-like structure
  const stats = [
    { label: 'Sentiment', value: data.sentiment },
    { label: 'Language', value: data.language },
    { label: 'Word Count', value: data.word_count.toString() }
  ];
  
  stats.forEach((stat) => {
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 15, 2, 2, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(102, 126, 234);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.label + ':', margin + 5, yPos + 10);
    
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    
    // Sentiment color coding
    if (stat.label === 'Sentiment') {
      if (data.sentiment === 'Positive') {
        doc.setTextColor(17, 153, 142);
      } else if (data.sentiment === 'Negative') {
        doc.setTextColor(238, 9, 121);
      } else {
        doc.setTextColor(100, 100, 100);
      }
    }
    
    doc.text(stat.value, pageWidth - margin - 5, yPos + 10, { align: 'right' });
    
    yPos += 20;
  });
  
  yPos += 10;
  
  // Analysis Details Box
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFillColor(240, 242, 245);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 30, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'bold');
  doc.text('ANALYSIS DETAILS', margin + 5, yPos + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Total Keywords Extracted: ' + data.keywords.length, margin + 5, yPos + 16);
  doc.text('Document Complexity: ' + (data.word_count > 500 ? 'High' : data.word_count > 200 ? 'Medium' : 'Low'), margin + 5, yPos + 22);
  
  // Footer
  const footerY = pageHeight - 20;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'italic');
  doc.text('Generated by Intelligent Document Analyzer', pageWidth / 2, footerY, { align: 'center' });
  doc.text('Powered by Advanced NLP Technology', pageWidth / 2, footerY + 5, { align: 'center' });
  
  // Add page border
  doc.setDrawColor(102, 126, 234);
  doc.setLineWidth(0.5);
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
  
  // Save the PDF
  const fileName = 'Document_Analysis_Report_' + Date.now() + '.pdf';
  doc.save(fileName);
  
  showNotification('✅ Report downloaded successfully!');
}