// State
let currentFile = null;
let analysisResult = null;

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

        const response = await fetch('http://localhost:3000/api/analyze', {
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

    data.recommendations.forEach((rec, index) => {
        const div = document.createElement('div');
        div.className = 'glass-warm rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden group';
        div.innerHTML = `
            <div class="blur-result absolute inset-0 bg-dark-800/80 z-10 flex items-center justify-center">
                <span class="material-symbols-outlined text-4xl text-gray-500">lock</span>
            </div>
            <div class="w-full aspect-[3/4] bg-dark-900 rounded-xl mb-3 overflow-hidden">
                <div class="w-full h-full bg-gradient-to-br from-mint-500/10 to-apricot-500/10"></div>
            </div>
            <h3 class="font-bold text-gray-300 blur-sm">HIDDEN</h3>
            <p class="text-xs text-mint-400 mt-1 blur-sm">Match 98%</p>
        `;
        container.appendChild(div);
    });
}

// Payment Flow
function processPayment(method) {
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
                <img id="result-img-${index}" src="" class="w-full h-full object-cover hidden transition-transform duration-700 group-hover:scale-105" onclick="viewImage(this.src)">
                <div id="loader-${index}" class="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                    <span class="material-symbols-outlined animate-spin text-3xl mb-2 text-mint-400">autorenew</span>
                    <span class="text-xs">AI 합성 중...</span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                    <button class="w-full py-2 bg-white text-dark-950 font-bold rounded-lg text-sm">크게 보기</button>
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

        const response = await fetch('http://localhost:3000/api/generate-style', {
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

function viewImage(src) {
    if (!src) return;
    const w = window.open("");
    w.document.write(`<img src="${src}" style="max-width:100%; height:auto;">`);
}
