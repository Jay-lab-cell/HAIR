// State
let currentFile = null;
let analysisResult = null;
let originalSelfieDataUrl = null;

// Navigation
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden'); // Ensure hidden class is applied if used
        el.style.display = 'none'; // Force hide
    });

    // Show target screen
    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
        target.classList.add('active');
        target.classList.remove('hidden');
        target.style.display = 'flex';
        window.scrollTo(0, 0);
    }
}

// File Upload
function handleUpload(event) {
    const file = event.target.files[0];
    if (file) {
        currentFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('preview-img');
            preview.src = e.target.result;
            preview.classList.remove('hidden');
            document.getElementById('upload-placeholder').classList.add('hidden');

            const btn = document.getElementById('btn-analyze');
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        };
        reader.readAsDataURL(file);
    }
}

// API: Start Analysis
async function startAnalysis() {
    if (!currentFile) return;

    showScreen('analyzing');

    // Fake progress animation
    let progress = 0;
    const progressText = document.getElementById('progress-pct');
    const progressRing = document.getElementById('progress-ring');
    const statusText = document.getElementById('analysis-status');

    const interval = setInterval(() => {
        if (progress < 90) {
            progress += Math.random() * 5;
            if (progress > 90) progress = 90;
            updateProgress(progress);
        }
    }, 200);

    function updateProgress(pct) {
        const p = Math.min(100, Math.max(0, pct));
        progressText.innerText = `${Math.round(p)}%`;
        const offset = 339.3 - (339.3 * p) / 100;
        progressRing.style.strokeDashoffset = offset;

        if (p < 30) statusText.innerText = "얼굴형을 인식하고 있습니다...";
        else if (p < 60) statusText.innerText = "이목구비 비율을 계산중입니다...";
        else statusText.innerText = "최적의 헤어스타일을 매칭중입니다...";
    }

    try {
        const formData = new FormData();
        formData.append('selfie', currentFile);

        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Analysis failed');
        }

        const data = await response.json();
        analysisResult = data;

        clearInterval(interval);
        updateProgress(100);

        setTimeout(() => {
            renderBlurredResults(data);
            showScreen('results-blur');
        }, 500);

    } catch (error) {
        clearInterval(interval);
        alert(`분석 중 오류가 발생했습니다: ${error.message}`);
        showScreen('upload');
        console.error(error);
    }
}

// Render: Blurred Results (Screen 3)
function renderBlurredResults(data) {
    document.getElementById('face-type-badge').innerText = data.faceType;

    const container = document.getElementById('style-cards-container');
    container.innerHTML = '';

    // Best Match (First Item)
    const bestMatch = data.recommendations[0];
    const bestMatchDiv = document.createElement('div');
    bestMatchDiv.className = 'col-span-2 md:col-span-3 lg:col-span-5 mb-8'; // Full width
    bestMatchDiv.innerHTML = `
        <div class="glass-warm rounded-3xl p-1 relative overflow-hidden group border border-mint-400/30 shadow-[0_0_50px_-12px_rgba(94,234,212,0.2)]">
            <div class="absolute top-6 left-6 z-20 bg-mint-400 text-dark-950 font-black px-4 py-1.5 rounded-full text-sm animate-pulse">
                🏆 BEST MATCH
            </div>
            <div class="absolute top-6 right-6 z-20 bg-dark-950/80 backdrop-blur text-mint-400 font-bold px-4 py-1.5 rounded-full border border-mint-500/30">
                ${bestMatch.match}% 일치
            </div>
            
            <div class="relative aspect-[4/3] md:aspect-[21/9] bg-dark-900 rounded-[20px] overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-mint-500/20 via-dark-900 to-apricot-500/20 blur-xl"></div>
                
                <!-- Silhouette / Blur Effect -->
                <div class="absolute inset-0 flex items-center justify-center">
                    <div class="w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/5 blur-3xl"></div>
                </div>

                <div class="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-6">
                    <span class="material-symbols-outlined text-6xl md:text-8xl text-mint-200/50 mb-4 blur-sm">sentiment_spark</span>
                    <h3 class="text-3xl md:text-5xl font-black text-white blur-md mb-2">HIDDEN STYLE</h3>
                    <p class="text-lg text-gray-400 blur-sm max-w-lg mx-auto">AI가 분석한 당신의 얼굴형에 가장 완벽한 스타일입니다</p>
                </div>

                <!-- Lock Overlay -->
                <div class="absolute inset-0 z-30 bg-dark-950/60 backdrop-blur-[8px] flex flex-col items-center justify-center">
                    <div class="bg-white/10 p-4 rounded-full mb-4 border border-white/20">
                        <span class="material-symbols-outlined text-4xl text-white">lock</span>
                    </div>
                    <p class="text-xl font-bold text-white mb-1">AI가 찾은 <span class="gradient-text">인생 머리</span></p>
                    <p class="text-sm text-gray-400">지금 확인하지 않으면 평생 모를 수도 있어요</p>
                </div>
            </div>
        </div>
    `;
    container.appendChild(bestMatchDiv);

    // Other Matches (Grid)
    data.recommendations.slice(1).forEach((rec, index) => {
        const div = document.createElement('div');
        div.className = 'glass-warm rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden group border border-white/5';
        div.innerHTML = `
            <div class="absolute top-3 right-3 z-10 bg-dark-950/60 text-xs font-bold px-2 py-1 rounded text-gray-400 border border-white/10">
                ${rec.match}%
            </div>
            <div class="w-full aspect-[3/4] bg-dark-900 rounded-xl mb-3 overflow-hidden relative">
                <div class="w-full h-full bg-gradient-to-br from-mint-500/5 to-apricot-500/5 blur-lg"></div>
                 <div class="absolute inset-0 flex items-center justify-center">
                    <span class="material-symbols-outlined text-4xl text-gray-700 blur-[2px]">face</span>
                </div>
                <div class="absolute inset-0 bg-dark-950/40 backdrop-blur-[4px] flex items-center justify-center">
                     <span class="material-symbols-outlined text-2xl text-white/50">lock</span>
                </div>
            </div>
            <h3 class="font-bold text-gray-400 blur-[3px] text-sm">HIDDEN</h3>
        `;
        container.appendChild(div);
    });
}

// Payment Flow
function processPayment(event, method) {
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span class="material-symbols-outlined animate-spin">refresh</span> 결제 처리중...`;

    setTimeout(() => {
        btn.innerHTML = originalText;
        renderFullResults(analysisResult);
        showScreen('results-full');

        // Start generating images in background
        analysisResult.recommendations.forEach((rec, index) => {
            generateStyleImage(rec.prompt, rec.name, index);
        });
    }, 1500);
}

// Render: Full Results (Screen 5)
function renderFullResults(data) {
    // Set user selfie
    const reader = new FileReader();
    reader.onload = (e) => {
        originalSelfieDataUrl = e.target.result;
        document.getElementById('report-selfie').src = e.target.result;
    };
    reader.readAsDataURL(currentFile);

    // Face Features
    const tagsContainer = document.getElementById('face-analysis-tags');
    tagsContainer.innerHTML = `
        <span class="px-3 py-1 rounded-full bg-mint-500/10 text-mint-400 text-sm border border-mint-500/20">#${data.faceType}</span>
        <span class="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-sm border border-white/10">#${data.faceFeatures.forehead}</span>
        <span class="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-sm border border-white/10">#${data.faceFeatures.cheekbones}</span>
    `;

    document.getElementById('face-analysis-desc').innerText = data.analysisDescription;

    // Salon Tips
    const tipsContainer = document.getElementById('salon-tips');
    tipsContainer.innerHTML = '';
    data.recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.className = "flex items-start gap-2 text-sm";
        li.innerHTML = `<span class="material-symbols-outlined text-apricot-400 text-lg flex-shrink-0">check</span> <span>${rec.tip}</span>`;
        tipsContainer.appendChild(li);
    });

    // Style Cards (Loaders initially)
    const cardsContainer = document.getElementById('full-style-cards');
    cardsContainer.innerHTML = '';

    data.recommendations.forEach((rec, index) => {
        const div = document.createElement('div');
        div.className = 'glass-warm rounded-2xl p-5 border border-white/10 hover:border-mint-400/30 transition-all';
        div.innerHTML = `
            <div class="relative w-full aspect-[3/4] bg-dark-900 rounded-xl mb-4 overflow-hidden group">
                <img id="result-img-${index}" src="" class="w-full h-full object-cover hidden transition-transform duration-700 group-hover:scale-105">
                <div id="loader-${index}" class="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                    <span class="material-symbols-outlined animate-spin text-3xl mb-2 text-mint-400">autorenew</span>
                    <span class="text-xs">AI 합성 중...</span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                    <button onclick="viewImage(document.getElementById('result-img-${index}').src, '${rec.name.replace(/'/g, "\\'")}')"
                        class="w-full py-2 bg-white text-dark-950 font-bold rounded-lg text-sm">크게 보기</button>
                </div>
            </div>
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-bold text-lg text-white">${rec.name}</h3>
                <span class="text-mint-400 font-bold text-sm ring-1 ring-mint-400/30 px-2 py-0.5 rounded">${rec.match}% Match</span>
            </div>
            <p class="text-gray-400 text-sm leading-relaxed">${rec.description}</p>
        `;
        cardsContainer.appendChild(div);
    });
}

// API: Generate Style Image
async function generateStyleImage(prompt, styleName, index) {
    try {
        const formData = new FormData();
        formData.append('selfie', currentFile);
        formData.append('stylePrompt', prompt);
        formData.append('styleName', styleName);

        const response = await fetch('/api/generate-style', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Generation failed');

        const data = await response.json();

        const img = document.getElementById(`result-img-${index}`);
        const loader = document.getElementById(`loader-${index}`);

        if (img && loader) {
            img.src = data.image;
            img.classList.remove('hidden');
            loader.classList.add('hidden');
        }

    } catch (error) {
        console.error(`Error generating ${styleName}:`, error);
        const loader = document.getElementById(`loader-${index}`);
        if (loader) loader.innerHTML = `<span class="material-symbols-outlined text-red-500">error</span><span class="text-xs text-red-400">실패</span>`;
    }
}

// Utils
function saveResults() {
    alert('결과 이미지가 저장되었습니다! (데모)');
}

function shareResults() {
    if (navigator.share) {
        navigator.share({
            title: '내 얼굴형에 딱 맞는 헤어스타일 찾음!',
            text: 'FaceStyle AI로 분석해봤는데 대박임...',
            url: window.location.href
        });
    } else {
        alert('주소가 복사되었습니다.');
    }
}

function viewImage(afterSrc, styleName) {
    if (!afterSrc) return;
    const beforeSrc = originalSelfieDataUrl || '';
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Before / After - ${styleName || 'FaceStyle AI'}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#0B0F1A; color:#fff; font-family:'Noto Sans KR',sans-serif; min-height:100vh; display:flex; flex-direction:column; align-items:center; }
.top-bar { width:100%; padding:16px 24px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); }
.logo { display:flex; align-items:center; gap:8px; font-weight:600; font-size:16px; }
.logo-icon { width:28px; height:28px; border-radius:8px; background:linear-gradient(135deg,#2DD4BF,#FFB08A); display:flex; align-items:center; justify-content:center; font-size:14px; }
.close-btn { padding:8px 20px; border-radius:20px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:#9CA3AF; font-size:13px; cursor:pointer; transition:all .2s; }
.close-btn:hover { background:rgba(255,255,255,0.05); color:#fff; }
.title-area { text-align:center; padding:24px 16px 16px; }
.style-name { font-size:24px; font-weight:700; background:linear-gradient(135deg,#FFB08A,#5EEAD4); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.subtitle { color:#6B7280; font-size:13px; margin-top:6px; }
.compare-wrapper { position:relative; width:90vw; max-width:600px; aspect-ratio:3/4; border-radius:20px; overflow:hidden; cursor:col-resize; margin:0 auto; box-shadow:0 0 60px rgba(94,234,212,0.08); border:1px solid rgba(255,255,255,0.08); }
.compare-img { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; pointer-events:none; user-select:none; }
.after-clip { clip-path:inset(0 0 0 50%); }
.slider-line { position:absolute; top:0; bottom:0; width:3px; background:linear-gradient(180deg,#FFB08A,#5EEAD4); left:50%; transform:translateX(-50%); z-index:10; pointer-events:none; }
.slider-handle { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:44px; height:44px; border-radius:50%; background:rgba(11,15,26,0.85); border:2px solid rgba(255,255,255,0.3); backdrop-filter:blur(8px); z-index:11; display:flex; align-items:center; justify-content:center; pointer-events:none; }
.slider-handle svg { width:20px; height:20px; fill:none; stroke:#fff; stroke-width:2; }
.label { position:absolute; bottom:16px; z-index:12; padding:6px 16px; border-radius:20px; font-size:12px; font-weight:600; backdrop-filter:blur(12px); pointer-events:none; }
.label-before { left:16px; background:rgba(255,255,255,0.12); color:#fff; }
.label-after { right:16px; background:linear-gradient(135deg,#FFB08A,#5EEAD4); color:#0B0F1A; }
.hint { text-align:center; padding:20px; color:#4B5563; font-size:12px; }
@media(max-width:480px) { .compare-wrapper { width:94vw; } .style-name { font-size:20px; } }
</style>
</head>
<body>
<div class="top-bar">
  <div class="logo"><div class="logo-icon">✦</div>FaceStyle AI</div>
  <button class="close-btn" onclick="window.close()">닫기</button>
</div>
<div class="title-area">
  <div class="style-name">${styleName || '헤어스타일'}</div>
  <div class="subtitle">드래그 또는 스크롤로 비교해보세요</div>
</div>
<div class="compare-wrapper" id="cw">
  <img class="compare-img" src="${beforeSrc}" alt="Before">
  <img class="compare-img after-clip" id="afterImg" src="${afterSrc}" alt="After">
  <div class="slider-line" id="sl"></div>
  <div class="slider-handle" id="sh">
    <svg viewBox="0 0 24 24"><polyline points="8,4 4,12 8,20"/><polyline points="16,4 20,12 16,20"/></svg>
  </div>
  <span class="label label-before">BEFORE</span>
  <span class="label label-after">AFTER</span>
</div>
<div class="hint">◀ 드래그 또는 마우스 스크롤로 비교 ▶</div>
<script>
const cw = document.getElementById('cw');
const afterImg = document.getElementById('afterImg');
const sl = document.getElementById('sl');
const sh = document.getElementById('sh');
let pos = 50;
function setPos(p) {
  pos = Math.max(2, Math.min(98, p));
  afterImg.style.clipPath = 'inset(0 0 0 ' + pos + '%)';
  sl.style.left = pos + '%';
  sh.style.left = pos + '%';
}
let dragging = false;
cw.addEventListener('mousedown', (e) => { dragging = true; setPos(e.offsetX / cw.offsetWidth * 100); });
cw.addEventListener('touchstart', (e) => { dragging = true; const r = cw.getBoundingClientRect(); setPos((e.touches[0].clientX - r.left) / r.width * 100); }, {passive:true});
window.addEventListener('mousemove', (e) => { if (!dragging) return; const r = cw.getBoundingClientRect(); setPos((e.clientX - r.left) / r.width * 100); });
window.addEventListener('touchmove', (e) => { if (!dragging) return; const r = cw.getBoundingClientRect(); setPos((e.touches[0].clientX - r.left) / r.width * 100); }, {passive:true});
window.addEventListener('mouseup', () => dragging = false);
window.addEventListener('touchend', () => dragging = false);
cw.addEventListener('wheel', (e) => { e.preventDefault(); setPos(pos + (e.deltaY > 0 ? 3 : -3)); }, {passive:false});
</script>
</body>
</html>`);
    w.document.close();
}
