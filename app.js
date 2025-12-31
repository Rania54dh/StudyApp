document.addEventListener('DOMContentLoaded', function() {
  updateDateTime();
  setInterval(updateDateTime, 60000);
  loadTasks();
  loadNotes();
  initTasks();
  initNotes();
  initDashboard();
});

function getCurrentDate(format = 'long') {
  const today = new Date();
  if (format === 'short') {
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    return `${month}/${day}/${year}`;
  }
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return today.toLocaleDateString('en-US', options);
}

function updateDateTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  const timeElement = document.getElementById('currentTime');
  const dateElement = document.getElementById('currentDate');
  const dateMessage = document.getElementById('dateMessage');
  
  if (timeElement) timeElement.textContent = `${hours}:${minutes}`;
  if (dateElement) dateElement.textContent = getCurrentDate('short');
  if (dateMessage) dateMessage.textContent = `Today is ${getCurrentDate()}`;
}

let tasks = [];
let notes = [];

function initTasks() {
  const addTaskBtn = document.getElementById('addTaskBtn');
  const taskInput = document.getElementById('taskInput');
  
  if (!addTaskBtn || !taskInput) return;
  
  addTaskBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });
}

function loadTasks() {
  const savedTasks = localStorage.getItem('myAppTasks');
  if (savedTasks) {
    tasks = JSON.parse(savedTasks);
    renderTasks();
    updateDashboardStats();
  }
}

function saveTasks() {
  localStorage.setItem('myAppTasks', JSON.stringify(tasks));
  updateDashboardStats();
}

function addTask() {
  const taskInput = document.getElementById('taskInput');
  const taskText = taskInput.value.trim();
  
  if (!taskText) {
    alert('Please enter a task!');
    return;
  }
  
  tasks.push({
    id: Date.now(),
    text: taskText,
    completed: false,
    createdAt: new Date().toISOString()
  });
  
  taskInput.value = '';
  taskInput.focus();
  saveTasks();
  renderTasks();
}

function deleteTask(taskId) {
  if (confirm('Are you sure you want to delete this task?')) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    renderTasks();
  }
}

function toggleTaskCompletion(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
  }
}

function renderTasks() {
  const taskList = document.getElementById('taskList');
  if (!taskList) return;
  
  taskList.innerHTML = '';
  
  if (tasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-clipboard-list" style="font-size: 48px; color: #ddd; margin-bottom: 10px;"></i>
        <p>No tasks yet. Add your first task above!</p>
      </div>
    `;
    return;
  }
  
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  sortedTasks.forEach(task => {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
    taskElement.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
      <span class="task-title">${escapeHtml(task.text)}</span>
      <button class="delete-btn" onclick="deleteTask(${task.id})">
        <i class="fas fa-trash"></i>
      </button>
    `;
    
    taskElement.querySelector('.task-checkbox').addEventListener('change', () => {
      toggleTaskCompletion(task.id);
    });
    
    taskList.appendChild(taskElement);
  });
}

function updateDashboardStats() {
  const totalTasksEl = document.getElementById('totalTasks');
  if (!totalTasksEl) return;
  
  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.filter(t => !t.completed).length;
  
  totalTasksEl.textContent = tasks.length;
  
  const completedTasksEl = document.querySelector('.totalbox2 .total');
  const pendingTasksEl = document.querySelector('.totalbox3 .total');
  
  if (completedTasksEl) completedTasksEl.textContent = completedCount;
  if (pendingTasksEl) pendingTasksEl.textContent = pendingCount;
  
  updateTodayTasksPreview();
}

function updateTodayTasksPreview() {
  const todayTasksPreview = document.getElementById('todayTasksPreview');
  if (!todayTasksPreview) return;
  
  todayTasksPreview.innerHTML = '';
  
  const today = new Date().toDateString();
  const todayTasks = tasks.filter(task => {
    const taskDate = new Date(task.createdAt).toDateString();
    return taskDate === today;
  });
  
  const completedToday = todayTasks.filter(task => task.completed).length;
  const totalToday = todayTasks.length;
  const progressPercentage = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;
  
  // Add progress bar
  const progressHTML = `
    <div class="task-progress">
      <span class="progress-text">Today's Progress</span>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
      </div>
      <span class="progress-count">${completedToday}/${totalToday}</span>
    </div>
  `;
  
  todayTasksPreview.innerHTML = progressHTML;
  
  if (todayTasks.length === 0) {
    todayTasksPreview.innerHTML += `
      <div class="no-tasks-preview">
        <i class="fas fa-tasks"></i>
        <p>No tasks for today</p>
        <p class="subtext">Add tasks to see them here</p>
      </div>
    `;
    return;
  }
  
  // Sort: incomplete first, then completed
  const sortedTasks = [...todayTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  sortedTasks.slice(0, 5).forEach(task => {
    const taskElement = document.createElement('div');
    taskElement.className = `preview-task-item ${task.completed ? 'completed' : ''}`;
    taskElement.innerHTML = `
      <span class="preview-task-text">${escapeHtml(task.text)}</span>
      <span class="preview-task-status">${task.completed ? 'Completed' : 'Pending'}</span>
    `;
    
    // Add click to toggle completion
    taskElement.addEventListener('click', (e) => {
      if (!e.target.classList.contains('preview-task-status')) {
        toggleTaskCompletion(task.id);
      }
    });
    
    todayTasksPreview.appendChild(taskElement);
  });
  
  if (todayTasks.length > 5) {
    const moreElement = document.createElement('div');
    moreElement.className = 'preview-more';
    moreElement.textContent = `+${todayTasks.length - 5} more tasks`;
    moreElement.addEventListener('click', () => {
      window.location.href = 'Tasks.html';
    });
    todayTasksPreview.appendChild(moreElement);
  }
}

function initDashboard() {
  const welcomeMsg = document.getElementById('welcomeMsg');
  if (!welcomeMsg) return;
  
  const hour = new Date().getHours();
  if (hour < 12) welcomeMsg.textContent = 'Good Morning';
  else if (hour < 18) welcomeMsg.textContent = 'Good Afternoon';
  else welcomeMsg.textContent = 'Good Evening';
}

function initNotes() {
  const addNoteBtn = document.getElementById('addNoteBtn');
  const notesContainer = document.getElementById('notesContainer');
  
  if (!addNoteBtn || !notesContainer) return;
  
  addNoteBtn.addEventListener('click', () => openNoteModal());
}

function loadNotes() {
  const savedNotes = localStorage.getItem('myAppNotes');
  if (savedNotes) {
    notes = JSON.parse(savedNotes);
  } else {
    notes = [{
      id: 1,
      title: 'Meeting Notes',
      content: 'Discuss project roadmap and deadlines. Review Q1 goals and allocate resources accordingly.',
      date: getFormattedDate(),
      color: '#ffffff'
    }];
  }
  saveNotes();
  renderNotes();
}

function saveNotes() {
  localStorage.setItem('myAppNotes', JSON.stringify(notes));
}

function renderNotes() {
  const notesContainer = document.getElementById('notesContainer');
  if (!notesContainer) return;
  
  notesContainer.innerHTML = '';
  
  const addNoteCard = document.createElement('div');
  addNoteCard.className = 'add-note';
  addNoteCard.innerHTML = '<span>+</span><p>Add Note</p>';
  addNoteCard.addEventListener('click', () => openNoteModal());
  notesContainer.appendChild(addNoteCard);
  
  notes.forEach(note => {
    const noteElement = document.createElement('div');
    noteElement.className = 'note-card';
    noteElement.style.backgroundColor = note.color || '#ffffff';
    noteElement.innerHTML = `
      <div class="note-title">${escapeHtml(note.title)}</div>
      <div class="note-content">${escapeHtml(note.content).replace(/\n/g, '<br>')}</div>
      <div class="note-footer">
        <span class="note-date">${note.date}</span>
        <div class="note-actions">
          <span class="edit-note" onclick="editNote(${note.id})">✏️</span>
          <span class="delete-note" onclick="deleteNote(${note.id})">🗑️</span>
        </div>
      </div>
    `;
    notesContainer.appendChild(noteElement);
  });
}

function openNoteModal(noteId = null) {
  const existingNote = noteId ? notes.find(n => n.id === noteId) : null;
  
  const modal = document.createElement('div');
  modal.className = 'note-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${noteId ? 'Edit Note' : 'Add New Note'}</h3>
      <input type="text" id="noteTitleInput" class="modal-input" placeholder="Note Title" value="${existingNote?.title || ''}">
      <textarea id="noteContentInput" class="modal-textarea" placeholder="Write your note here..." rows="8">${existingNote?.content || ''}</textarea>
      
      <div class="color-picker">
        <span>Color:</span>
        <div class="color-options">
          ${['#ffffff', '#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3'].map(color => 
            `<div class="color-option ${(!noteId && color === '#ffffff') || (existingNote?.color === color) ? 'selected' : ''}" style="background-color: ${color}" data-color="${color}"></div>`
          ).join('')}
        </div>
      </div>
      
      <div class="modal-buttons">
        <button class="modal-btn cancel-btn">Cancel</button>
        <button class="modal-btn save-btn">${noteId ? 'Update' : 'Save'} Note</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', function() {
      modal.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
    });
  });
  
  setTimeout(() => modal.querySelector('#noteTitleInput').focus(), 100);
  
  modal.querySelector('.save-btn').addEventListener('click', () => saveNote(noteId));
  modal.querySelector('.cancel-btn').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  const closeOnEscape = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', closeOnEscape);
    }
  };
  document.addEventListener('keydown', closeOnEscape);
}

function saveNote(noteId = null) {
  const title = document.querySelector('#noteTitleInput')?.value.trim();
  const content = document.querySelector('#noteContentInput')?.value.trim();
  const selectedColor = document.querySelector('.color-option.selected')?.dataset.color || '#ffffff';
  
  if (!title || !content) {
    alert('Please fill in both title and content!');
    return;
  }
  
  if (noteId) {
    const noteIndex = notes.findIndex(n => n.id === noteId);
    if (noteIndex !== -1) {
      notes[noteIndex] = { ...notes[noteIndex], title, content, color: selectedColor, date: getFormattedDate() };
    }
  } else {
    notes.push({ id: Date.now(), title, content, color: selectedColor, date: getFormattedDate() });
  }
  
  saveNotes();
  renderNotes();
  document.querySelector('.note-modal')?.remove();
  showNotification(noteId ? 'Note updated successfully!' : 'Note added successfully!');
}

function editNote(noteId) {
  openNoteModal(noteId);
}

function deleteNote(noteId) {
  if (confirm('Are you sure you want to delete this note?')) {
    notes = notes.filter(note => note.id !== noteId);
    saveNotes();
    renderNotes();
    showNotification('Note deleted!', 'error');
  }
}

function getFormattedDate() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-trash'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}