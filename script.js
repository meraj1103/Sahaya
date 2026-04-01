/* ===========================
   SAHAYA JAVASCRIPT LOGIC
=========================== */

// Navigation System
let screenHistory = ['home'];

function navigateTo(screenId, isBack = false) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });

    // Reset report screen state if navigating away
    if (screenId !== 'report') {
        const catSel = document.getElementById('category-selection');
        const repForm = document.getElementById('report-form');
        const repSuc = document.getElementById('report-success');
        if (catSel) { catSel.classList.remove('hidden'); catSel.classList.add('active'); }
        if (repForm) { repForm.classList.add('hidden'); repForm.classList.remove('active'); }
        if (repSuc) { repSuc.classList.add('hidden'); repSuc.classList.remove('active'); }
    }

    // Show target screen
    const targetScreen = document.getElementById(screenId + '-screen');
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    // Manage History Stack
    const mainTabs = ['home', 'problems', 'report', 'leaderboard', 'profile'];
    if (!isBack) {
        if (mainTabs.includes(screenId)) {
            screenHistory = [screenId]; // Reset stack if jumping to a main tab
        } else if (screenHistory[screenHistory.length - 1] !== screenId) {
            screenHistory.push(screenId);
        }
    }

    // Update bottom navigation state if it's a main tab (sub-pages don't change nav bar)
    if (mainTabs.includes(screenId)) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));

        if (screenId === 'report') {
            const reportBtn = document.querySelector('.report-nav');
            if (reportBtn) reportBtn.classList.add('active');
        } else {
            navItems.forEach(item => {
                const span = item.querySelector('span:last-child');
                if (span && (span.textContent.toLowerCase() === screenId || (screenId === 'leaderboard' && span.textContent === 'Rank'))) {
                    item.classList.add('active');
                }
            });
        }
    }
}

function goBack() {
    if (screenHistory.length > 1) {
        screenHistory.pop(); // Remove current
        const prevScreen = screenHistory[screenHistory.length - 1];
        navigateTo(prevScreen, true);
    } else {
        navigateTo('home');
    }
}

// Report Flow System
function selectCategory(categoryName) {
    document.getElementById('selected-category-title').textContent = categoryName;

    // Set hidden field for EmailJS
    const hiddenType = document.getElementById('hidden_problem_type');
    if (hiddenType) hiddenType.value = categoryName;

    // Hide category selection, show form
    const categoryGrid = document.getElementById('category-selection');
    const reportForm = document.getElementById('report-form');

    categoryGrid.classList.remove('active');
    setTimeout(() => {
        categoryGrid.classList.add('hidden');
        reportForm.classList.remove('hidden');
        // Slight delay for animation
        setTimeout(() => reportForm.classList.add('active'), 50);
    }, 200);
}

function backToCategories() {
    const categoryGrid = document.getElementById('category-selection');
    const reportForm = document.getElementById('report-form');

    reportForm.classList.remove('active');
    setTimeout(() => {
        reportForm.classList.add('hidden');
        categoryGrid.classList.remove('hidden');
        setTimeout(() => categoryGrid.classList.add('active'), 50);
    }, 200);
}

function submitForm(event) {
    event.preventDefault(); // Prevent actual form submission reload

    const reportForm = document.getElementById('report-form');
    const successScreen = document.getElementById('report-success');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const formElement = event.target;

    // Button loading state simulation
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    // Example: 1. Save to Firebase (Simulated)
    console.log("Saving complaint to Firebase...");

    // Explicitly gather parameters for EmailJS Template
    const descValue = formElement.querySelector('[name="description"]').value;
    const imgValue = formElement.querySelector('[name="image_link"]').value;
    const pType = document.getElementById('hidden_problem_type').value || "Not Specified";

    const templateParams = {
        name: formElement.querySelector('[name="name"]').value,
        email: formElement.querySelector('[name="email"]').value,
        problem: pType,
        location: formElement.querySelector('[name="location"]').value,
        message: descValue,
        image: imgValue
    };

    console.log("Sending the following details to EmailJS:", templateParams);

    const finishSubmission = () => {
        // Save report locally and award points
        saveNewReport(templateParams);

        // Advance UI to success state
        reportForm.classList.remove('active');
        setTimeout(() => {
            reportForm.classList.add('hidden');
            successScreen.classList.remove('hidden');
            setTimeout(() => successScreen.classList.add('active'), 50);

            // Reset form and button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            formElement.reset();
            document.getElementById('hidden_problem_type').value = ""; // clear hidden field
            const preview = document.getElementById('photo-preview');
            const uploadPlaceholder = document.getElementById('upload-placeholder');
            if (preview) preview.style.display = 'none';
            if (uploadPlaceholder) uploadPlaceholder.style.display = 'flex';
            const hiddenImageLink = formElement.querySelector('[name="image_link"]');
            if (hiddenImageLink) hiddenImageLink.value = "No image uploaded";
        }, 200);
    };

    // NOTE: You MUST replace 'YOUR_SERVICE_ID' and 'YOUR_TEMPLATE_ID' with actual values from EmailJS Dashboard.
    emailjs.send('service_k0hvldi', 'template_8vmb0yy', templateParams)
        .then(() => {
            console.log('SUCCESS! Email sent.');
            finishSubmission();
        }, (error) => {
            console.log('FAILED...', error);
            alert("Warning: Saved to database, but failed to send email. Check API Keys.");
            finishSubmission();
        });
}

// Interactions 
document.addEventListener('DOMContentLoaded', () => {
    initData();
    renderUI();
    // Vote button toggling
    const voteBtns = document.querySelectorAll('.icon-btn-small');
    voteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            btn.classList.toggle('active');
            const icon = btn.querySelector('span');
            if (btn.classList.contains('active')) {
                icon.classList.add('fill-icon');
            } else {
                icon.classList.remove('fill-icon');
            }
        });
    });

    // Filter tabs toggling (Problems Screen)
    const tabs = document.querySelectorAll('.filter-tabs .tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // Photo Upload Preview
    const photoInput = document.getElementById('photo-input');
    const photoPreview = document.getElementById('photo-preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const hiddenImageLink = document.querySelector('input[name="image_link"]');

    if (photoInput) {
        photoInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                const file = this.files[0];

                // Show loading state
                const originalPlaceholder = uploadPlaceholder.innerHTML;
                uploadPlaceholder.innerHTML = '<span class="material-symbols-rounded" style="animation: rotate 2s linear infinite;">sync</span><span style="margin-top:8px;">Getting Location & Processing...</span>';
                if (photoPreview) photoPreview.style.display = 'none';
                uploadPlaceholder.style.display = 'flex';

                const processImage = (locationText) => {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const img = new Image();
                        img.src = e.target.result;
                        img.onload = function () {
                            const canvas = document.createElement('canvas');
                            const MAX_WIDTH = 400; // Resize large images more aggressively to fit EmailJS 50KB limit
                            const MAX_HEIGHT = 400;
                            let width = img.width;
                            let height = img.height;

                            // Maintain aspect ratio
                            if (width > height) {
                                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                            } else {
                                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                            }

                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);

                            // Add Geo-Watermark
                            if (locationText) {
                                const pad = 10;
                                ctx.font = "12px Arial";

                                // Draw background for text
                                ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
                                ctx.fillRect(0, height - 30, width, 30);

                                // Draw location text
                                ctx.fillStyle = "#ffffff";
                                ctx.textAlign = "left";
                                ctx.fillText(locationText, pad, height - 10);

                                // Draw timestamp
                                const timeStr = new Date().toLocaleString();
                                ctx.font = "10px Arial";
                                ctx.textAlign = "right";
                                ctx.fillText(timeStr, width - pad, height - 10);
                            }

                            // Compress to JPEG
                            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);

                            photoPreview.src = compressedBase64;
                            photoPreview.style.display = 'block';
                            uploadPlaceholder.style.display = 'none';

                            // Restore placeholder for next time
                            uploadPlaceholder.innerHTML = originalPlaceholder;

                            if (hiddenImageLink) {
                                hiddenImageLink.value = compressedBase64;
                                console.log("Image compressed successfully with watermark. Size: ~" + Math.round(compressedBase64.length / 1024) + " KB");
                            }
                        };
                    };
                    reader.readAsDataURL(file);
                };

                // Fetch Location
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                            const lat = pos.coords.latitude;
                            const lon = pos.coords.longitude;
                            let locText = `Lat: ${lat.toFixed(4)}, Lng: ${lon.toFixed(4)}`;
                            try {
                                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
                                const data = await res.json();
                                if (data && data.display_name) {
                                    // Make it short
                                    const parts = data.display_name.split(', ');
                                    locText = parts.slice(0, 3).join(', ');
                                }
                            } catch (e) {
                                console.log("Reverse geocode failed", e);
                            }

                            const locInput = document.getElementById('location-input');
                            if (locInput) locInput.value = locText;

                            processImage(locText);
                        },
                        (err) => {
                            console.log("Geolocation error", err);
                            processImage("Location: Unknown");
                        },
                        { timeout: 7000, maximumAge: 10000 } // 7 seconds timeout
                    );
                } else {
                    processImage("Location: Not Supported");
                }
            }
        });
    }
});

/* ===========================
   LOCAL DATA & STATE LOGIC
=========================== */

function initData() {
    if (!localStorage.getItem('sahaya_reports')) {
        localStorage.setItem('sahaya_reports', JSON.stringify([]));
    }
    if (!localStorage.getItem('sahaya_points')) {
        localStorage.setItem('sahaya_points', '0');
    }
    if (!localStorage.getItem('sahaya_user_name')) {
        localStorage.setItem('sahaya_user_name', 'John Doe');
    }
}

function saveNewReport(params) {
    const reports = JSON.parse(localStorage.getItem('sahaya_reports'));
    const newReport = {
        id: Date.now().toString(),
        title: params.problem || "Civic Issue",
        location: params.location || "Unknown Location",
        status: 'pending',
        date: new Date().toISOString(),
        image: params.image !== "No image uploaded" ? params.image : null
    };
    reports.unshift(newReport); // Add to beginning
    localStorage.setItem('sahaya_reports', JSON.stringify(reports));

    // Award random points between 10 and 100
    const earnedPoints = Math.floor(Math.random() * 91) + 10;
    let currentPoints = parseInt(localStorage.getItem('sahaya_points') || '0');
    currentPoints += earnedPoints;
    localStorage.setItem('sahaya_points', currentPoints.toString());

    // Show points message in success screen
    const successDesc = document.getElementById('success-desc');
    if (successDesc) {
        successDesc.innerHTML = `Complaint successfully submitted and sent to the municipal team.<br><strong style="color:var(--accent); display:block; margin-top:8px;">+${earnedPoints} Points Earned!</strong>`;
    }

    renderUI(); // Re-render the app instantly
}

function renderUI() {
    const role = localStorage.getItem('sahaya_role') || 'citizen';
    const fabButton = document.querySelector('.fab');
    const reportNav = document.querySelector('.report-nav');

    if (role === 'employee') {
        if (fabButton) fabButton.style.display = 'none';
        if (reportNav) reportNav.style.display = 'none';
    } else {
        if (fabButton) fabButton.style.display = 'flex';
        if (reportNav) reportNav.style.display = 'flex';
    }

    const reports = JSON.parse(localStorage.getItem('sahaya_reports') || '[]');
    const points = parseInt(localStorage.getItem('sahaya_points') || '0');

    // Stats
    const total = reports.length;
    const pending = reports.filter(r => r.status === 'pending').length;
    const resolved = reports.filter(r => r.status === 'resolved').length;

    const userName = localStorage.getItem('sahaya_user_name') || 'John Doe';
    let initials = 'JD';
    if (userName.trim().length > 0) {
        const parts = userName.trim().split(/\s+/);
        if (parts.length > 1) {
            initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        } else {
            initials = userName.substring(0, 2).toUpperCase();
        }
    }

    // Update DOM Stats safely
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('display-profile-name', userName);
    setTxt('display-profile-initials', initials);
    setTxt('details-avatar-initials', initials);
    setTxt('leaderboard-name-display', userName);

    const detailsNameInput = document.getElementById('details-name-input');
    if (detailsNameInput) detailsNameInput.value = userName;

    const reportNameInput = document.getElementById('report-name-input');
    if (reportNameInput) reportNameInput.value = userName;
    setTxt('stat-total', total);
    setTxt('stat-pending', pending);
    setTxt('stat-processing', 0);
    setTxt('stat-resolved', resolved);
    setTxt('profile-submitted', total);
    setTxt('profile-points', points);
    setTxt('leaderboard-submitted', total);
    setTxt('leaderboard-points', points + ' pts');
    setTxt('redeem-balance', points);
    setTxt('store-balance', points);

    // Render Lists
    renderRecentList(reports);
    renderMainList(reports);
}

function renderRecentList(reports) {
    const container = document.getElementById('dashboard-recent-list');
    if (!container) return;
    container.innerHTML = '';

    // Show max 3 recent
    const recent = reports.slice(0, 3);
    if (recent.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 20px; color:var(--text-muted);">No reports yet. Start reporting!</p>';
        return;
    }

    recent.forEach(r => {
        const timeAgo = formatTimeAgo(new Date(r.date));
        const statusClass = r.status === 'pending' ? 'status-pending' : 'status-resolved';

        container.innerHTML += `
            <div class="problem-card">
                <div class="problem-card-header">
                    <span class="status-badge ${statusClass}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>
                    <span class="time-ago">${timeAgo}</span>
                </div>
                <h3 class="problem-title">${r.title}</h3>
                <p class="problem-location"><span class="material-symbols-rounded icon-sm">location_on</span> ${r.location}</p>
                <div class="problem-card-footer" style="justify-content:space-between; align-items:center;">
                    <div class="vote-count">
                        <button class="icon-btn-small active" aria-label="Upvote"><span class="material-symbols-rounded fill-icon">thumb_up</span></button>
                    </div>
                    ${r.status === 'pending' ? `<button onclick="initiateResolve('${r.id}')" style="background:var(--secondary); color:#fff; border:none; padding:4px 10px; border-radius:4px; font-size:12px; cursor:pointer;">Upload Fix Photo</button>` : ''}
                </div>
            </div>
        `;
    });
}

function renderMainList(reports) {
    const container = document.getElementById('problems-main-list');
    if (!container) return;

    const activeTabObj = document.querySelector('.filter-tabs .tab.active');
    const isActiveShowing = activeTabObj && activeTabObj.textContent.trim() === 'Active';

    const filtered = reports.filter(r => isActiveShowing ? r.status === 'pending' : r.status === 'resolved');

    container.innerHTML = '';
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 30px; color:var(--text-muted);">Empty list.</p>';
        return;
    }

    const role = localStorage.getItem('sahaya_role') || 'citizen';

    filtered.forEach(r => {
        const timeAgo = formatTimeAgo(new Date(r.date));
        const statusClass = r.status === 'pending' ? 'status-pending' : 'status-resolved';
        const imgHtml = r.image ? `<img src="${r.image}" style="width:100%; height:120px; object-fit:cover; border-radius:8px 8px 0 0;" />` : `<div class="card-image bg-placeholder-1"></div>`;

        const resolvedImgHtml = r.resolvedImage ? `
            <div class="image-comparison" style="border-radius: 8px 8px 0 0; overflow: hidden; height: 120px; display:flex;">
                <div class="img-box" style="flex:1; position:relative; background-size:cover; background-position:center; background-image: url('${r.image || ""}'); border-right: 2px solid white;">
                    <div class="label" style="position:absolute; bottom:8px; left:8px; background:rgba(0,0,0,0.6); color:white; font-size:10px; padding:2px 6px; border-radius:4px; font-weight:600;">Before</div>
                </div>
                <div class="img-box" style="flex:1; position:relative; background-size:cover; background-position:center; background-image: url('${r.resolvedImage}');">
                    <div class="label" style="position:absolute; bottom:8px; left:8px; background:rgba(0,0,0,0.6); color:white; font-size:10px; padding:2px 6px; border-radius:4px; font-weight:600;">After</div>
                </div>
            </div>` : `<div class="card-image" style="background:#10B981; height:120px; border-radius:8px 8px 0 0; display:flex; align-items:center; justify-content:center; color:white; font-size:30px;"><span class="material-symbols-rounded">check_circle</span></div>`;

        container.innerHTML += `
            <div class="problem-card detailed ${r.status === 'resolved' ? 'resolved-card' : ''}">
                ${r.status === 'pending' ? imgHtml : resolvedImgHtml}
                <div class="card-content">
                    <div class="problem-card-header">
                        <span class="status-badge ${statusClass}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>
                        <span class="time-ago">${timeAgo}</span>
                    </div>
                    <h3 class="problem-title">${r.title}</h3>
                    <p class="problem-location"><span class="material-symbols-rounded icon-sm">location_on</span> ${r.location}</p>
                    
                    ${r.status === 'pending' ? `
                    <div class="problem-card-footer" style="justify-content:space-between; align-items:center; margin-top:12px;">
                        <button class="icon-btn-small active" style="background:#F3F4F6; padding:6px 12px; border-radius:16px; border:none; display:flex; gap:6px; align-items:center;"><span class="material-symbols-rounded fill-icon" style="font-size:16px;">thumb_up</span> 1</button>
                        <button onclick="initiateResolve('${r.id}')" style="background:var(--secondary); color:#fff; border:none; padding:6px 14px; border-radius:4px; font-size:13px; font-weight:600; cursor:pointer;">Upload Fix Photo</button>
                    </div>` : ''}
                </div>
            </div>
        `;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.filter-tabs .tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Let the existing active class toggle run, then re-render
            setTimeout(renderUI, 10);
        });
    });
});

window.currentResolvingId = null;

function initiateResolve(id) {
    window.currentResolvingId = id;
    const input = document.getElementById('resolve-photo-input');
    if (input) input.click();
}

document.addEventListener('DOMContentLoaded', () => {
    const resolveInput = document.getElementById('resolve-photo-input');
    if (resolveInput) {
        resolveInput.addEventListener('change', function () {
            if (this.files && this.files[0] && window.currentResolvingId) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = function () {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 400;
                        const MAX_HEIGHT = 400;
                        let width = img.width;
                        let height = img.height;
                        if (width > height) {
                            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                        } else {
                            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                        }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);

                        let reports = JSON.parse(localStorage.getItem('sahaya_reports') || '[]');
                        const idx = reports.findIndex(r => r.id === window.currentResolvingId);
                        if (idx > -1) {
                            reports[idx].status = 'resolved';
                            reports[idx].resolvedImage = compressedBase64;
                            localStorage.setItem('sahaya_reports', JSON.stringify(reports));
                            const earnedPoints = Math.floor(Math.random() * 91) + 10;
                            let currentPoints = parseInt(localStorage.getItem('sahaya_points') || '0');
                            currentPoints += earnedPoints;
                            localStorage.setItem('sahaya_points', currentPoints.toString());
                            const pointMessage = `\n+${earnedPoints} Points Earned!`;

                            alert('Problem successfully resolved with photo!' + pointMessage);
                            renderUI();
                        }
                        window.currentResolvingId = null;
                        resolveInput.value = ""; // reset input
                    };
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
});



function formatTimeAgo(date) {
    const diff = Math.floor((new Date() - date) / 1000);
    if (diff < 60) return diff + "s ago";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    return Math.floor(diff / 86400) + "d ago";
}

function saveProfile(event) {
    event.preventDefault();
    const nameInput = document.getElementById('details-name-input');
    if (nameInput) {
        localStorage.setItem('sahaya_user_name', nameInput.value.trim() || 'Anonymous');
    }
    alert('Profile Updated Successfully!');
    renderUI();
    goBack();
}

function redeemReward(cost, rewardName) {
    let currentPoints = parseInt(localStorage.getItem('sahaya_points') || '0');
    if (currentPoints >= cost) {
        currentPoints -= cost;
        localStorage.setItem('sahaya_points', currentPoints.toString());
        alert(`Successfully redeemed ${rewardName}!`);
        renderUI();
    } else {
        alert(`Insufficient Points. You need ${cost} pts.`);
    }
}
