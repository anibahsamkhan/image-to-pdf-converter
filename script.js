// script.js
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertBtn');
const downloadSection = document.getElementById('downloadSection');
const downloadLink = document.getElementById('downloadLink');

let images = [];

// File handling
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const reader = new FileReader();
        reader.onload = (e) => {
            images.push({
                data: e.target.result,
                name: file.name
            });
            updateFileList();
        };
        reader.readAsDataURL(file);
    }
}

function updateFileList() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = images.map(img => 
        `<div class="file-item">${img.name}</div>`
    ).join('');
}

// Conversion logic
convertBtn.addEventListener('click', async () => {
    if (images.length === 0) {
        alert('Please upload at least one image');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const spread = document.querySelector('input[name="spread"]:checked').value;
    const scaling = document.getElementById('scaling').value;
    
    const borders = {
        top: parseInt(document.getElementById('topBorder').value) || 0,
        right: parseInt(document.getElementById('rightBorder').value) || 0,
        bottom: parseInt(document.getElementById('bottomBorder').value) || 0,
        left: parseInt(document.getElementById('leftBorder').value) || 0,
        color: document.getElementById('borderColor').value
    };

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 0; i < images.length; i++) {
        if (i !== 0 && spread === 'single') doc.addPage();
        
        const img = new Image();
        img.src = images[i].data;
        
        await new Promise(resolve => {
            img.onload = () => {
                let imgWidth, imgHeight;
                const aspectRatio = img.width / img.height;

                if (scaling === 'fit') {
                    imgWidth = pageWidth - borders.left - borders.right;
                    imgHeight = imgWidth / aspectRatio;
                } else if (scaling === 'original') {
                    imgWidth = img.width * 0.75;
                    imgHeight = img.height * 0.75;
                } else {
                    // Custom scaling implementation
                    imgWidth = pageWidth - borders.left - borders.right;
                    imgHeight = imgWidth / aspectRatio;
                }

                // Draw border
                if (borders.top + borders.right + borders.bottom + borders.left > 0) {
                    doc.setDrawColor(borders.color);
                    doc.rect(
                        borders.left,
                        borders.top,
                        pageWidth - borders.left - borders.right,
                        pageHeight - borders.top - borders.bottom
                    );
                }

                // Add image
                doc.addImage(
                    img,
                    'JPEG',
                    borders.left,
                    borders.top,
                    imgWidth,
                    imgHeight
                );

                if (spread === 'double' && i % 2 === 1) doc.addPage();
                resolve();
            };
        });
    }

    // Save PDF
    const pdfBlob = doc.output('blob');
    saveAs(pdfBlob, 'converted.pdf');
    downloadSection.classList.remove('hidden');
});

// Reset after download
downloadLink.addEventListener('click', () => {
    images = [];
    fileInput.value = '';
    downloadSection.classList.add('hidden');
    document.getElementById('fileList').innerHTML = '';
});