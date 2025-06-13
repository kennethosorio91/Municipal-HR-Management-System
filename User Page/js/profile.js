// Load documents and COE requests when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadDocuments();
    loadCOERequests();
    setupEventListeners();
});

function setupEventListeners() {
    // Document upload form submission
    document.getElementById('uploadForm').addEventListener('submit', async (e) => {
        e.preventDefault();

            const formData = new FormData();
        formData.append('title', document.getElementById('docTitle').value);
        formData.append('type', document.getElementById('docType').value);
        formData.append('file', document.getElementById('docFile').files[0]);

            try {
                const response = await fetch('../handlers/upload_document.php', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                if (data.success) {
                    alert('Document uploaded successfully');
                closeUploadModal();
                    loadDocuments(); // Refresh document list
                } else {
                throw new Error(data.message || 'Failed to upload document');
                }
            } catch (error) {
            alert(error.message);
            }
    });

    // COE request form submission
    document.getElementById('coeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const purpose = document.getElementById('purpose').value;
        const otherPurpose = document.getElementById('otherPurpose').value;
        const remarks = document.getElementById('remarks').value;

        const finalPurpose = purpose === 'Other' ? otherPurpose : purpose;

        try {
            const response = await fetch('../handlers/request_coe.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    purpose: finalPurpose,
                    remarks: remarks
                })
            });

            const data = await response.json();
            if (data.success) {
                alert('COE request submitted successfully');
                closeCOEModal();
                loadCOERequests(); // Refresh COE requests list
            } else {
                throw new Error(data.message || 'Failed to submit COE request');
            }
        } catch (error) {
            alert(error.message);
        }
    });

    // Handle purpose selection change
    document.getElementById('purpose').addEventListener('change', function() {
        const otherPurposeField = document.getElementById('otherPurposeField');
        otherPurposeField.style.display = this.value === 'Other' ? 'block' : 'none';
        
        if (this.value !== 'Other') {
            document.getElementById('otherPurpose').value = '';
        }
    });
}

async function loadDocuments() {
    try {
        const response = await fetch('../handlers/get_documents.php');
        const data = await response.json();
        
        if (data.success) {
            const documentList = document.querySelector('.document-list');
            let html = '';

            data.documents.forEach(doc => {
                const statusClass = doc.status.toLowerCase();
                html += `
                    <div class="document-item">
                        <div class="document-info">
                            <span class="document-title">${doc.title}</span>
                            <span class="document-type">${doc.type}</span>
                            <span class="document-date">Uploaded: ${formatDate(doc.upload_date)}</span>
                            <span class="document-status ${statusClass}">${doc.status}</span>
                        </div>
                        <div class="document-actions">
                            <button class="download-btn" onclick="downloadDocument(${doc.id})">
                                <img src="../assets/download.png" alt="Download">
                                Download
                            </button>
                            <button class="delete-btn" onclick="deleteDocument(${doc.id})">
                                <img src="../assets/delete.png" alt="Delete">
                                Delete
                            </button>
                        </div>
                    </div>
                `;
            });

            documentList.innerHTML = html;
        }
    } catch (error) {
        console.error('Failed to load documents:', error);
        alert('Failed to load documents. Please try again later.');
    }
}

async function loadCOERequests() {
    try {
        const response = await fetch('../handlers/get_coe_requests.php');
        const data = await response.json();
        
        if (data.success) {
            const coeList = document.querySelector('.coe-list');
            let html = '';

            data.requests.forEach(request => {
                const statusClass = request.status.toLowerCase();
                html += `
                    <div class="coe-item">
                        <div class="coe-info">
                            <span class="coe-purpose">${request.purpose}</span>
                            <span class="coe-remarks">${request.remarks || ''}</span>
                            <span class="coe-date">
                                Requested: ${formatDate(request.request_date)}
                                ${request.issue_date ? ` | Issued: ${formatDate(request.issue_date)}` : ''}
                            </span>
                        </div>
                        <div class="coe-status">
                            <span class="status-tag ${statusClass}">${request.status}</span>
                            ${request.status === 'Issued' ? 
                                `<button class="download-btn" onclick="downloadCOE(${request.id})">
                                    <img src="../assets/download.png" alt="Download">
                                    Download
                                </button>` : ''}
                        </div>
                    </div>
                `;
            });

            coeList.innerHTML = html;
        }
    } catch (error) {
        console.error('Failed to load COE requests:', error);
        alert('Failed to load COE requests. Please try again later.');
    }
}

// Modal Functions
function openUploadModal() {
    document.getElementById('uploadModal').classList.add('active');
    document.getElementById('uploadForm').reset();
}

function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
}

function openCOEModal() {
    document.getElementById('coeModal').classList.add('active');
    document.getElementById('coeForm').reset();
    document.getElementById('otherPurposeField').style.display = 'none';
}

function closeCOEModal() {
    document.getElementById('coeModal').classList.remove('active');
}

// Utility Functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

async function downloadDocument(documentId) {
    try {
    window.location.href = `../handlers/download_document.php?id=${documentId}`;
    } catch (error) {
        alert('Failed to download document. Please try again later.');
    }
}

async function deleteDocument(documentId) {
    if (!confirm('Are you sure you want to delete this document?')) {
        return;
    }

    try {
        const response = await fetch(`../handlers/delete_document.php?id=${documentId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
            alert('Document deleted successfully');
            loadDocuments(); // Refresh the document list
        } else {
            throw new Error(data.message || 'Failed to delete document');
        }
    } catch (error) {
        alert(error.message);
    }
}

async function downloadCOE(requestId) {
    try {
    window.location.href = `../handlers/download_coe.php?id=${requestId}`;
    } catch (error) {
        alert('Failed to download COE. Please try again later.');
    }
} 