document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registrationForm');
  const userListContainer = document.getElementById('userList');
  const toast = document.getElementById('toast');

  const GEMINI_API_KEY = 'AIzaSyCkMG23ZGzZvcgpo8p9VdLOaaR8uigiYZE'; // Replace with your actual Gemini API key
  let aiQuestionGenerated = false;
  let currentAiQuestion = '';

  // Load existing users from local storage
  if (userListContainer) {
    loadUsers();
  }

  if (form) {
    const aiSection = document.getElementById('aiSection');
    const aiQuestionText = document.getElementById('aiQuestionText');
    const btnText = document.getElementById('btnText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const submitBtn = document.getElementById('submitBtn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Get form values
      const name = document.getElementById('name').value.trim();
      const dob = document.getElementById('dob').value;
      const place = document.getElementById('place').value.trim();
      const mobile = document.getElementById('mobile').value.trim();
      const complaintText = document.getElementById('complaint').value.trim();

      // Basic validation
      if (!name || !dob || !place || !mobile || !complaintText) {
        alert('Please fill in all basic fields');
        return;
      }

      if (!aiQuestionGenerated) {
        // Step 1: Generate AI Question
        try {
          submitBtn.disabled = true;
          btnText.textContent = 'Generating...';
          loadingSpinner.style.display = 'block';

          const prompt = `You are an assistant for a complaint registration platform. Based on the following complaint, generate exactly one short, specific follow-up question to gather more necessary details from the user. Only output the question text.\n\nComplaint: ${complaintText}`;

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
          }

          const data = await response.json();
          currentAiQuestion = data.candidates[0].content.parts[0].text.trim();

          aiQuestionText.textContent = currentAiQuestion;
          aiSection.style.display = 'block';
          aiQuestionGenerated = true;

          btnText.textContent = 'Submit Final Complaint';
        } catch (error) {
          alert('Failed to generate follow-up question. Please check your API key or try again.');
          console.error(error);
        } finally {
          submitBtn.disabled = false;
          loadingSpinner.style.display = 'none';
        }
        return;
      }

      // Step 2: Final Submit
      const aiAnswer = document.getElementById('aiAnswer').value.trim();
      if (!aiAnswer) {
        alert('Please provide an answer to the follow-up question.');
        return;
      }

      // Create user object
      const user = {
        id: Date.now().toString(),
        name,
        dob,
        place,
        mobile,
        complaint: complaintText,
        aiQuestion: currentAiQuestion,
        userAnswer: aiAnswer,
        registeredAt: new Date().toISOString()
      };

      // Save to local storage
      saveUser(user);

      // Reset form & state
      form.reset();
      aiQuestionGenerated = false;
      currentAiQuestion = '';
      aiSection.style.display = 'none';
      btnText.textContent = 'Ask Follow-up Question';

      // Show success toast
      showToast('Complaint registered successfully!');

      // Update UI
      if (userListContainer) {
        loadUsers();
      }
    });
  }

  function saveUser(user) {
    let users = JSON.parse(localStorage.getItem('registeredComplaints')) || [];
    users.push(user);
    localStorage.setItem('registeredComplaints', JSON.stringify(users));
  }

  function loadUsers() {
    const users = JSON.parse(localStorage.getItem('registeredComplaints')) || [];

    if (users.length === 0) {
      userListContainer.innerHTML = `
        <div class="empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
          <p>No complaints registered yet.</p>
        </div>
      `;
      return;
    }

    // Sort by newest first
    users.sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));

    userListContainer.innerHTML = '';

    users.forEach(user => {
      const userEl = document.createElement('div');
      userEl.className = 'user-item';

      // Format dates
      const dobFormatted = new Date(user.dob).toLocaleDateString();
      const registeredFormatted = new Date(user.registeredAt).toLocaleDateString();

      userEl.innerHTML = `
        <div class="user-header">
          <span class="user-name">${escapeHTML(user.name)}</span>
          <span class="user-date">Registered: ${registeredFormatted}</span>
        </div>
        <div class="user-details">
          <div class="detail-item">
            <span class="detail-label">Date of Birth</span>
            <span class="detail-value">${dobFormatted}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Mobile</span>
            <span class="detail-value">${escapeHTML(user.mobile)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Place</span>
            <span class="detail-value">${escapeHTML(user.place)}</span>
          </div>
          <div class="detail-item" style="grid-column: 1 / -1; margin-top: 0.5rem; background: rgba(15, 23, 42, 0.4); padding: 1rem; border-radius: 12px;">
            <span class="detail-label">Complaint</span>
            <span class="detail-value" style="white-space: pre-wrap; display: block; margin-top: 0.5rem; font-size: 0.95rem;">${escapeHTML(user.complaint || '')}</span>
          </div>
          ${user.aiQuestion && user.userAnswer ? `
          <div class="detail-item ai-detail-block">
            <span class="detail-label" style="color: #c4b5fd;">AI Follow-up Question</span>
            <span class="detail-value" style="font-style: italic; margin-bottom: 1rem; display: block; margin-top: 0.5rem;">${escapeHTML(user.aiQuestion)}</span>
            
            <span class="detail-label" style="color: #c4b5fd;">User's Answer</span>
            <span class="detail-value" style="display: block; margin-top: 0.5rem; white-space: pre-wrap;">${escapeHTML(user.userAnswer)}</span>
          </div>
          ` : ''}
        </div>
      `;

      userListContainer.appendChild(userEl);
    });
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // Utility to prevent XSS
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g,
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
});
