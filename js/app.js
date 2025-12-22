let isSelectMode = false;
let selectedNotes = new Set();

const selectBtn = document.getElementById('select-mode-btn');
const shareBtn = document.getElementById('share-btn');
const countSpan = document.getElementById('count');

const notesEl = document.querySelector('.notes');
const addBtn = document.querySelector('.note-add');

// 1. Функція для збереження всіх нотаток у LocalStorage
function saveNotes() {
    const notes = [];
    document.querySelectorAll('.note').forEach(note => {
        // Зчитуємо саме з textarea, бо там найактуальніший текст
        const title = note.querySelector('#note-title-input').value;
        const text = note.querySelector('#note-textarea').value;
        notes.push({ title, text });
    });
    localStorage.setItem('myNotes', JSON.stringify(notes));
    console.log('Збережено:', notes); // Для перевірки в консолі
}

function createNote(title, text) {
    const noteEl = document.createElement('div');
    noteEl.classList.add('note');
    noteEl.innerHTML = ` <div class="note-header">
        <p id="note-title">${title}</p>
        <textarea id="note-title-input" class="hidden">${title}</textarea>
        <div class="note-actions">
            <button class="note-edit"><i class="fa-regular fa-pen-to-square"></i></button>
            <button class="note-delete"><i class="fa-solid fa-trash"></i></button>
        </div>
    </div>
    <p id="note-text">${text}</p>
    <textarea id="note-textarea" class="hidden">${text}</textarea>
    `

    const editBtn = noteEl.querySelector(".note-edit");
    const deleteBtn = noteEl.querySelector(".note-delete");
    const titleEl = noteEl.querySelector("#note-title");
    const textEl = noteEl.querySelector("#note-text");
    const titleInputEl = noteEl.querySelector("#note-title-input");
    const textInputEl = noteEl.querySelector("#note-textarea");

    editBtn.addEventListener('click', (e) => {
        titleEl.classList.toggle('hidden');
        textEl.classList.toggle('hidden');

        titleInputEl.classList.toggle('hidden');
        textInputEl.classList.toggle('hidden');

        saveNotes(); // Зберігаємо при перемиканні
    });

    deleteBtn.addEventListener('click', (e) => {
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

        noteEl.addEventListener('click', () => {
            if (isSelectMode) {
                noteEl.classList.toggle('selected');
                const noteData = { title, text };
                
                // Додаємо або видаляємо з набору
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

    addBtn.addEventListener('click', (e) => {
        const el = createNote("Назва", "Ваш текст");
        notesEl.appendChild(el);
        saveNotes(); // Зберігаємо нову порожню нотатку
    })

    

    // Завантаження при старті
    function loadNotes() {
        const savedNotes = JSON.parse(localStorage.getItem('myNotes'));
        if (savedNotes) {
            savedNotes.forEach(note => {
                const el = createNote(note.title, note.text);
                notesEl.appendChild(el);
            });
        }
    }

    // Функція перемикання режиму вибору
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

// Функція надсилання в Firebase
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
            // Використовуємо методи, які ми "прокинули" з модуля
            const { collection, addDoc } = window.fbMethods;
            
            // Створюємо документ у колекції "shared_notes"
            const docRef = await addDoc(collection(window.db, "shared_notes"), {
                notes: notesToShare,
                createdAt: new Date()
            });

            // Генеруємо посилання
            const shareLink = `${window.location.origin}${window.location.pathname}?id=${docRef.id}`;
            
            // Виводимо результат
            prompt("Ось ваше посилання для друзів:", shareLink);
            
            // Вимикаємо режим вибору
            selectBtn.click(); 

        } catch (e) {
            console.error("Помилка:", e);
            alert("Ой! Щось пішло не так. Перевірте, чи увімкнено 'Test Mode' у Firebase Firestore.");
        }
    });
        async function checkSharedNotes() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareId = urlParams.get('id');

        if (shareId) {
            const { doc, getDoc } = window.fbMethods;
            const docRef = doc(window.db, "shared_notes", shareId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                // Очищуємо екран від старих нотаток (опціонально)
                // notesEl.innerHTML = ''; 
                
                data.notes.forEach(note => {
                    const el = createNote(note.title, note.text);
                    notesEl.appendChild(el);
                });
                alert("Ви отримали спільні нотатки!");
                
                // Очищуємо URL без перезавантаження
                window.history.replaceState({}, document.title, window.location.pathname);
            } else {
                console.log("Такої нотатки не існує");
            }
        }
    }

        async function loadSharedNotes() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareId = urlParams.get('id');

        if (!shareId) {
            console.log("ID не знайдено в посиланні");
            return;
        }

        console.log("Знайдено ID:", shareId);

        // Додаємо невелику затримку, щоб Firebase точно ініціалізувався
        if (!window.fbMethods || !window.db) {
            console.log("Чекаю на Firebase...");
            setTimeout(loadSharedNotes, 500);
            return;
        }

        try {
            const { doc, getDoc } = window.fbMethods;
            const docRef = doc(window.db, "shared_notes", shareId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const sharedData = docSnap.data();
                console.log("Дані отримано:", sharedData);
                
                // Очищуємо контейнер, якщо хочете показати ТІЛЬКИ отримані нотатки
                // notesEl.innerHTML = ''; 

                sharedData.notes.forEach(note => {
                    const el = createNote(note.title, note.text);
                    notesEl.appendChild(el);
                });

                alert("Ви отримали спільні нотатки!");
                
                // Видаляємо ID з URL, щоб при оновленні сторінки нотатки не додавалися знову
                window.history.replaceState({}, document.title, window.location.pathname);
            } else {
                console.error("Документ не існує в базі Firebase!");
            }
        } catch (e) {
            console.error("Помилка при читанні з бази:", e);
        }
    }

    // Викликаємо перевірку після завантаження основних нотаток
    checkSharedNotes();
    loadSharedNotes();
    loadNotes();
