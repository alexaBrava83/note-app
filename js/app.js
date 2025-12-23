let isSelectMode = false;
let selectedNotes = new Set();

const selectBtn = document.getElementById('select-mode-btn');
const shareBtn = document.getElementById('share-btn');
const countSpan = document.getElementById('count');
const notesEl = document.querySelector('.notes');
const addBtn = document.querySelector('.note-add');

// Елементи модального вікна
const modal = document.getElementById('share-modal');
const shareInput = document.getElementById('share-url');
const copyBtn = document.getElementById('copy-btn');
const closeBtn = document.getElementById('close-modal');

// 1. Збереження у LocalStorage
function saveNotes() {
    const notes = [];
    document.querySelectorAll('.note').forEach(note => {
        const title = note.querySelector('#note-title-input').value;
        const text = note.querySelector('#note-textarea').value;
        notes.push({ title, text });
    });
    localStorage.setItem('myNotes', JSON.stringify(notes));
}

// 2. Створення нотатки
function createNote(title, text) {
    const noteEl = document.createElement('div');
    noteEl.classList.add('note');
    if (isSelectMode) noteEl.classList.add('selectable');

    noteEl.innerHTML = `
    <div class="note-header">
        <p id="note-title">${title}</p>
        <textarea id="note-title-input" class="hidden">${title}</textarea>
        <div class="note-actions">
            <button class="note-edit"><i class="fa-regular fa-pen-to-square"></i></button>
            <button class="note-delete"><i class="fa-solid fa-trash"></i></button>
        </div>
    </div>
    <p id="note-text">${text}</p>
    <textarea id="note-textarea" class="hidden">${text}</textarea>
    `;

    const editBtn = noteEl.querySelector(".note-edit");
    const deleteBtn = noteEl.querySelector(".note-delete");
    const titleEl = noteEl.querySelector("#note-title");
    const textEl = noteEl.querySelector("#note-text");
    const titleInputEl = noteEl.querySelector("#note-title-input");
    const textInputEl = noteEl.querySelector("#note-textarea");

    editBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Щоб не спрацьовував вибір нотатки
        titleEl.classList.toggle('hidden');
        textEl.classList.toggle('hidden');
        titleInputEl.classList.toggle('hidden');
        textInputEl.classList.toggle('hidden');
        saveNotes();
    });

    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        noteEl.remove();
        saveNotes();
    });

    titleInputEl.addEventListener('input', (e) => {
        titleEl.innerText = e.target.value;
        saveNotes();
    });

    textInputEl.addEventListener('input', (e) => {
        textEl.innerText = e.target.value;
        saveNotes();
    });

    // Логіка вибору нотатки
    noteEl.addEventListener('click', () => {
        if (isSelectMode) {
            noteEl.classList.toggle('selected');
            if (noteEl.classList.contains('selected')) {
                selectedNotes.add(noteEl);
            } else {
                selectedNotes.delete(noteEl);
            }
            updateShareButton();
        }
    });

    return noteEl;
}

// 3. Кнопка "Додати"
addBtn.addEventListener('click', () => {
    const el = createNote("Назва", "Ваш текст");
    notesEl.appendChild(el);
    saveNotes();
});

// 4. Завантаження локальних нотаток
function loadNotes() {
    const savedNotes = JSON.parse(localStorage.getItem('myNotes'));
    if (savedNotes) {
        savedNotes.forEach(note => {
            const el = createNote(note.title, note.text);
            notesEl.appendChild(el);
        });
    }
}

// 5. Режим вибору
selectBtn.addEventListener('click', () => {
    isSelectMode = !isSelectMode;
    selectBtn.innerText = isSelectMode ? "Скасувати" : "Вибрати";
    shareBtn.classList.toggle('hidden', !isSelectMode);
    
    document.querySelectorAll('.note').forEach(note => {
        note.classList.toggle('selectable', isSelectMode);
        note.classList.remove('selected');
    });
    selectedNotes.clear();
    updateShareButton();
});

function updateShareButton() {
    countSpan.innerText = selectedNotes.size;
    shareBtn.disabled = selectedNotes.size === 0;
}

// 6. Надсилання в Firebase та показ модалки
shareBtn.addEventListener('click', async () => {
    if (selectedNotes.size === 0) return;

    const notesToShare = [];
    selectedNotes.forEach(noteEl => {
        notesToShare.push({
            title: noteEl.querySelector('#note-title').innerText,
            text: noteEl.querySelector('#note-text').innerText
        });
    });

    try {
        const { collection, addDoc } = window.fbMethods;
        const docRef = await addDoc(collection(window.db, "shared_notes"), {
            notes: notesToShare,
            createdAt: new Date()
        });

        // Замість prompt відкриваємо модалку
        const shareLink = `${window.location.origin}${window.location.pathname}?id=${docRef.id}`;
        shareInput.value = shareLink;
        modal.classList.remove('hidden');
        
        selectBtn.click(); // Вимикаємо режим вибору

    } catch (e) {
        console.error("Помилка Firebase:", e);
        alert("Помилка: перевірте консоль або правила Firestore.");
    }
});

// 7. Логіка кнопок модального вікна
copyBtn.addEventListener('click', () => {
    shareInput.select();
    navigator.clipboard.writeText(shareInput.value);
    
    // Візуальний відгук
    const icon = copyBtn.querySelector('i');
    icon.classList.replace('fa-copy', 'fa-check');
    copyBtn.style.background = '#27ae60';
    
    setTimeout(() => {
        icon.classList.replace('fa-check', 'fa-copy');
        copyBtn.style.background = '#2ecc71';
    }, 2000);
});

closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
});

// 8. Завантаження спільних нотаток (об'єднана функція)
async function loadSharedNotes() {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('id');

    if (!shareId) return;

    if (!window.fbMethods || !window.db) {
        setTimeout(loadSharedNotes, 500);
        return;
    }

    try {
        const { doc, getDoc } = window.fbMethods;
        const docRef = doc(window.db, "shared_notes", shareId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const sharedData = docSnap.data();
            sharedData.notes.forEach(note => {
                const el = createNote(note.title, note.text);
                notesEl.appendChild(el);
            });
            saveNotes();
            alert("Ви отримали спільні нотатки!");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    } catch (e) {
        console.error("Помилка завантаження:", e);
    }
}

// Запуск при завантаженні сторінки
loadNotes();
loadSharedNotes();
