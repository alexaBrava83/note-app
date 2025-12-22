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

    loadNotes();
