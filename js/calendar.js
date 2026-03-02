// ===================================
// ESTADO DE LA APLICACIÓN
// ===================================
let currentYear = 2026;
let courses = [];
let editingCourseId = null;

// ===================================
// CONFIGURACIÓN DE MESES Y DÍAS
// ===================================
const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

// ===================================
// INICIALIZACIÓN
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    initializeYearSelector();
    renderCalendar();
    renderCoursesList();
    setupEventListeners();
});

// ===================================
// GENERACIÓN DEL CALENDARIO
// ===================================
function renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = '';

    for (let month = 0; month < 12; month++) {
        const monthContainer = createMonthContainer(month);
        calendarGrid.appendChild(monthContainer);
    }
}

function createMonthContainer(monthIndex) {
    const container = document.createElement('div');
    container.className = 'month-container';

    // Cabecera del mes
    const header = document.createElement('div');
    header.className = 'month-header';
    header.textContent = monthNames[monthIndex];
    container.appendChild(header);

    // Grid de días
    const daysGrid = document.createElement('div');
    daysGrid.className = 'days-grid';

    // Etiquetas de días de la semana
    dayNames.forEach(day => {
        const label = document.createElement('div');
        label.className = 'day-label';
        label.textContent = day;
        daysGrid.appendChild(label);
    });

    // Generar días del mes
    const firstDay = new Date(currentYear, monthIndex, 1);
    const lastDay = new Date(currentYear, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Calcular offset (lunes = 0)
    let startOffset = firstDay.getDay() - 1;
    if (startOffset === -1) startOffset = 6; // Domingo

    // Celdas vacías antes del primer día
    for (let i = 0; i < startOffset; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell empty';
        daysGrid.appendChild(emptyCell);
    }

    // Celdas con días
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        dayCell.textContent = day;
        dayCell.dataset.date = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Marcar día actual
        if (today.getFullYear() === currentYear && 
            today.getMonth() === monthIndex && 
            today.getDate() === day) {
            dayCell.classList.add('today');
        }

        // Verificar si hay cursos en este día
        const coursesOnDay = getCoursesOnDate(dayCell.dataset.date);
        if (coursesOnDay.length > 0) {
            dayCell.classList.add('has-course');
            
            // Añadir indicador del primer curso
            const indicator = document.createElement('div');
            indicator.className = `course-indicator ${coursesOnDay[0].level}`;
            dayCell.appendChild(indicator);
        }

        // Evento click para añadir curso
        dayCell.addEventListener('click', () => {
            openModal(dayCell.dataset.date);
        });

        daysGrid.appendChild(dayCell);
    }

    container.appendChild(daysGrid);
    return container;
}

// ===================================
// GESTIÓN DE CURSOS
// ===================================
function getCoursesOnDate(dateString) {
    return courses.filter(course => {
        const startDate = new Date(course.startDate);
        const endDate = new Date(course.endDate);
        const checkDate = new Date(dateString);
        
        return checkDate >= startDate && checkDate <= endDate;
    });
}

function addOrUpdateCourse(courseData) {
    if (editingCourseId) {
        // Actualizar curso existente
        const index = courses.findIndex(c => c.id === editingCourseId);
        if (index !== -1) {
            courses[index] = { ...courseData, id: editingCourseId };
        }
        editingCourseId = null;
    } else {
        // Añadir nuevo curso
        courseData.id = generateId();
        courses.push(courseData);
    }

    saveToLocalStorage();
    renderCalendar();
    renderCoursesList();
    closeModal();
}

function deleteCourse(courseId) {
    if (confirm('¿Estás seguro de que quieres eliminar este curso?')) {
        courses = courses.filter(c => c.id !== courseId);
        saveToLocalStorage();
        renderCalendar();
        renderCoursesList();
        closeModal();
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===================================
// RENDERIZADO DE LISTA DE CURSOS
// ===================================
function renderCoursesList() {
    const coursesList = document.getElementById('courses-list');
    const filterLevel = document.getElementById('filter-level').value;

    // Filtrar cursos
    let filteredCourses = courses;
    if (filterLevel !== 'todos') {
        filteredCourses = courses.filter(c => c.level === filterLevel);
    }

    // Ordenar por fecha
    filteredCourses.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (filteredCourses.length === 0) {
        coursesList.innerHTML = '<p class="empty-message">No hay cursos que coincidan con el filtro.</p>';
        return;
    }

    coursesList.innerHTML = '';
    filteredCourses.forEach(course => {
        const card = createCourseCard(course);
        coursesList.appendChild(card);
    });
}

function createCourseCard(course) {
    const card = document.createElement('div');
    card.className = `course-card ${course.level}`;
    card.addEventListener('click', () => openModalForEdit(course.id));

    const levelText = {
        'iniciacion': 'Iniciación',
        'medio': 'Medio',
        'avanzado': 'Avanzado',
        'tematico': 'Temático'
    }[course.level];

    card.innerHTML = `
        <h4>${course.name}</h4>
        <p>📅 ${formatDate(course.startDate)} - ${formatDate(course.endDate)}</p>
        <p>📍 ${course.location}, ${course.city}</p>
        ${course.instructor ? `<p>👨‍🏫 ${course.instructor}</p>` : ''}
        <span class="level-badge ${course.level}">${levelText}</span>
    `;

    return card;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// ===================================
// MODAL - AÑADIR/EDITAR CURSO
// ===================================
function openModal(defaultDate = null) {
    const modal = document.getElementById('course-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('course-form');
    const deleteBtn = document.getElementById('delete-btn');

    modalTitle.textContent = 'Añadir Curso';
    form.reset();
    deleteBtn.style.display = 'none';
    editingCourseId = null;

    if (defaultDate) {
        document.getElementById('start-date').value = defaultDate;
        document.getElementById('end-date').value = defaultDate;
    }

    modal.classList.add('active');
}

function openModalForEdit(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const modal = document.getElementById('course-modal');
    const modalTitle = document.getElementById('modal-title');
    const deleteBtn = document.getElementById('delete-btn');

    modalTitle.textContent = 'Editar Curso';
    editingCourseId = courseId;

    // Rellenar formulario
    document.getElementById('course-name').value = course.name;
    document.getElementById('start-date').value = course.startDate;
    document.getElementById('end-date').value = course.endDate;
    document.getElementById('course-location').value = course.location;
    document.getElementById('course-city').value = course.city;
    document.getElementById('course-level').value = course.level;
    document.getElementById('course-instructor').value = course.instructor || '';
    document.getElementById('course-notes').value = course.notes || '';

    deleteBtn.style.display = 'inline-block';
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('course-modal');
    modal.classList.remove('active');
    document.getElementById('course-form').reset();
    editingCourseId = null;
}

// ===================================
// EVENT LISTENERS
// ===================================
function setupEventListeners() {
    // Selector de año
    document.getElementById('year-select').addEventListener('change', (e) => {
        currentYear = parseInt(e.target.value);
        renderCalendar();
    });

    // Filtro de nivel
    document.getElementById('filter-level').addEventListener('change', () => {
        renderCoursesList();
    });

    // Modal - cerrar
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);

    // Modal - click fuera para cerrar
    document.getElementById('course-modal').addEventListener('click', (e) => {
        if (e.target.id === 'course-modal') {
            closeModal();
        }
    });

    // Formulario - submit
    document.getElementById('course-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const courseData = {
            name: document.getElementById('course-name').value.trim(),
            startDate: document.getElementById('start-date').value,
            endDate: document.getElementById('end-date').value,
            location: document.getElementById('course-location').value.trim(),
            city: document.getElementById('course-city').value.trim(),
            level: document.getElementById('course-level').value,
            instructor: document.getElementById('course-instructor').value.trim(),
            notes: document.getElementById('course-notes').value.trim()
        };

        // Validación de fechas
        if (new Date(courseData.endDate) < new Date(courseData.startDate)) {
            alert('La fecha de fin no puede ser anterior a la fecha de inicio.');
            return;
        }

        addOrUpdateCourse(courseData);
    });

    // Botón eliminar
    document.getElementById('delete-btn').addEventListener('click', () => {
        if (editingCourseId) {
            deleteCourse(editingCourseId);
        }
    });

    // Botón exportar
    document.getElementById('export-btn').addEventListener('click', exportCalendar);
    
    // Botón importar
    document.getElementById('import-btn').addEventListener('click', () => {
        document.getElementById('csv-file-input').click();
    });
    
    // Input de archivo CSV
    document.getElementById('csv-file-input').addEventListener('change', handleCSVImport);
}

// ===================================
// ALMACENAMIENTO LOCAL
// ===================================
function saveToLocalStorage() {
    localStorage.setItem('gecad_courses', JSON.stringify(courses));
    localStorage.setItem('gecad_year', currentYear);
}

function loadFromLocalStorage() {
    const savedCourses = localStorage.getItem('gecad_courses');
    const savedYear = localStorage.getItem('gecad_year');

    if (savedCourses) {
        courses = JSON.parse(savedCourses);
    }

    if (savedYear) {
        currentYear = parseInt(savedYear);
    }
}

// ===================================
// SELECTOR DE AÑO
// ===================================
function initializeYearSelector() {
    const yearSelect = document.getElementById('year-select');
    yearSelect.value = currentYear;
}

// ===================================
// EXPORTAR CALENDARIO
// ===================================
function exportCalendar() {
    if (courses.length === 0) {
        alert('No hay cursos para exportar.');
        return;
    }

    // Crear CSV
    let csv = 'Nombre del Curso,Fecha Inicio,Fecha Fin,Lugar/Sede,Ciudad,Nivel,Formador/es,Observaciones\n';
    
    courses.forEach(course => {
        const levelText = {
            'iniciacion': 'Iniciación',
            'medio': 'Medio',
            'avanzado': 'Avanzado',
            'tematico': 'Temático'
        }[course.level];

        csv += `"${course.name}","${formatDate(course.startDate)}","${formatDate(course.endDate)}","${course.location}","${course.city}","${levelText}","${course.instructor || ''}","${course.notes || ''}"\n`;
    });

    // Descargar archivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `calendario_formacion_gecad_${currentYear}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ===================================
// IMPORTAR DESDE GOOGLE CALENDAR (CSV)
// ===================================
function handleCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Verificar extensión del archivo
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isICS = fileName.endsWith('.ics') || fileName.endsWith('.ical');
    
    if (!isCSV && !isICS) {
        alert('Por favor, selecciona un archivo CSV o ICS válido.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            let importedCourses = [];
            
            // Detectar tipo de archivo y procesar
            if (isICS) {
                console.log('Procesando archivo ICS...');
                importedCourses = parseICSFile(content);
            } else {
                console.log('Procesando archivo CSV...');
                // Mostrar vista previa del contenido para debug
                console.log('Primeras 5 líneas del CSV:', content.split('\n').slice(0, 5).join('\n'));
                importedCourses = parseGoogleCalendarCSV(content);
            }
            
            if (importedCourses.length === 0) {
                alert(
                    '❌ No se encontraron cursos válidos en el archivo.\n\n' +
                    'Verifica que el archivo:\n' +
                    '• Tenga eventos con fechas válidas\n' +
                    '• Contenga al menos: título y fecha\n' +
                    (isCSV ? '• Tenga una cabecera con los nombres de columnas\n' : '') +
                    '• Las fechas estén en formato válido\n\n' +
                    'Consejo: Usa la plantilla en SOLUCION_MANUAL_CSV.md'
                );
                return;
            }

            // Preguntar si desea reemplazar o añadir
            const replace = confirm(
                `✅ Se encontraron ${importedCourses.length} cursos en el archivo ${isICS ? 'ICS' : 'CSV'}.\n\n` +
                `¿Deseas REEMPLAZAR todos los cursos actuales?\n\n` +
                `• OK = Reemplazar (se borrarán los cursos actuales)\n` +
                `• Cancelar = Añadir (se mantendrán los cursos actuales)`
            );

            if (replace) {
                courses = importedCourses;
            } else {
                // Añadir solo cursos que no existan (evitar duplicados)
                importedCourses.forEach(newCourse => {
                    const isDuplicate = courses.some(existingCourse => 
                        existingCourse.name === newCourse.name &&
                        existingCourse.startDate === newCourse.startDate
                    );
                    
                    if (!isDuplicate) {
                        courses.push(newCourse);
                    }
                });
            }

            saveToLocalStorage();
            renderCalendar();
            renderCoursesList();

            alert(`✅ ¡Importación completada con éxito!\n\n${importedCourses.length} cursos importados desde archivo ${isICS ? 'ICS' : 'CSV'}.`);
            
            // Limpiar input
            event.target.value = '';
        } catch (error) {
            console.error('Error detallado al importar:', error);
            alert(
                '❌ Error al procesar el archivo.\n\n' +
                'Detalles técnicos: ' + error.message + '\n\n' +
                'Soluciones:\n' +
                '1. Verifica que el archivo sea válido\n' +
                '2. Prueba exportando de nuevo desde Google Calendar\n' +
                '3. Usa la plantilla manual en SOLUCION_MANUAL_CSV.md\n' +
                '4. Prueba con el archivo de ejemplo: cursos_gecad_google_calendar.csv'
            );
        }
    };

    reader.onerror = function() {
        alert('❌ Error al leer el archivo. Por favor, intenta de nuevo.');
    };

    reader.readAsText(file, 'UTF-8');
}

function parseGoogleCalendarCSV(csvContent) {
    const lines = csvContent.split('\n');
    const importedCourses = [];

    // Buscar la línea de cabecera (más flexible)
    let headerIndex = -1;
    let headers = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lowerLine = line.toLowerCase();
        
        // Buscar líneas que parezcan cabeceras
        if (lowerLine.includes('subject') || 
            lowerLine.includes('title') || 
            lowerLine.includes('summary') ||
            (lowerLine.includes('start') && lowerLine.includes('date')) ||
            lowerLine.includes('nombre')) {
            headers = parseCSVLine(line);
            headerIndex = i;
            break;
        }
    }

    if (headerIndex === -1) {
        // Si no hay cabecera, intentar detectar automáticamente
        console.warn('No se encontró cabecera explícita, intentando detección automática');
        headers = parseCSVLine(lines[0]);
        headerIndex = 0;
    }

    // Mapear índices de columnas (más flexible)
    const subjectIndex = headers.findIndex(h => {
        const lower = h.toLowerCase();
        return lower.includes('subject') || lower.includes('title') || 
               lower.includes('summary') || lower.includes('nombre') || lower.includes('curso');
    });
    
    const startDateIndex = headers.findIndex(h => {
        const lower = h.toLowerCase();
        return (lower.includes('start') && lower.includes('date')) || 
               lower.includes('fecha inicio') || lower.includes('fecha de inicio');
    });
    
    const startTimeIndex = headers.findIndex(h => {
        const lower = h.toLowerCase();
        return (lower.includes('start') && lower.includes('time')) || 
               lower.includes('hora inicio') || lower.includes('hora de inicio');
    });
    
    const endDateIndex = headers.findIndex(h => {
        const lower = h.toLowerCase();
        return (lower.includes('end') && lower.includes('date')) || 
               lower.includes('fecha fin') || lower.includes('fecha final');
    });
    
    const endTimeIndex = headers.findIndex(h => {
        const lower = h.toLowerCase();
        return (lower.includes('end') && lower.includes('time')) || 
               lower.includes('hora fin') || lower.includes('hora final');
    });
    
    const locationIndex = headers.findIndex(h => {
        const lower = h.toLowerCase();
        return lower.includes('location') || lower.includes('lugar') || 
               lower.includes('ubicación') || lower.includes('sede');
    });
    
    const descriptionIndex = headers.findIndex(h => {
        const lower = h.toLowerCase();
        return lower.includes('description') || lower.includes('descripción') || 
               lower.includes('observaciones') || lower.includes('notas');
    });

    // Procesar cada línea de datos
    for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
            const fields = parseCSVLine(line);
            
            if (fields.length < 2) continue; // Línea inválida

            // Extraer subject (obligatorio)
            const subject = fields[subjectIndex] || fields[0] || '';
            if (!subject) continue; // Sin título, saltar

            // Extraer información del título (buscar emojis y niveles)
            const level = detectLevelFromTitle(subject);
            const cleanTitle = cleanCourseTitle(subject);

            // Parsear fechas - MÁS FLEXIBLE
            let startDate = null;
            if (startDateIndex >= 0 && fields[startDateIndex]) {
                startDate = parseFlexibleDate(fields[startDateIndex], fields[startTimeIndex]);
            } else if (fields.length > 1) {
                // Intentar con la segunda columna si no hay índice
                startDate = parseFlexibleDate(fields[1], fields[2]);
            }

            let endDate = null;
            if (endDateIndex >= 0 && fields[endDateIndex]) {
                endDate = parseFlexibleDate(fields[endDateIndex], fields[endTimeIndex]);
            } else if (startDate) {
                endDate = startDate; // Usar misma fecha de inicio
            }

            if (!startDate) {
                console.warn('Línea sin fecha válida, saltando:', line.substring(0, 50));
                continue; // Fecha inválida, saltar
            }

            // Extraer ubicación y ciudad
            const locationData = parseLocation(
                locationIndex >= 0 ? fields[locationIndex] : ''
            );
            
            // Extraer información de la descripción
            const description = descriptionIndex >= 0 ? fields[descriptionIndex] : '';
            const descriptionData = parseDescription(description);

            // Crear objeto de curso
            const course = {
                id: generateId(),
                name: cleanTitle,
                startDate: startDate,
                endDate: endDate || startDate,
                location: locationData.location || descriptionData.location || 'Sede UGT',
                city: locationData.city || descriptionData.city || '',
                level: level || descriptionData.level || 'medio',
                instructor: descriptionData.instructor || '',
                notes: descriptionData.notes || ''
            };

            importedCourses.push(course);
        } catch (error) {
            console.warn('Error procesando línea:', line.substring(0, 50), error);
            continue;
        }
    }

    return importedCourses;
}

// Nueva función para parsear fechas de forma más flexible
function parseFlexibleDate(dateStr, timeStr) {
    if (!dateStr) return null;

    try {
        // Limpiar string
        dateStr = dateStr.trim().replace(/['"]/g, '');
        
        // Intentar diferentes formatos
        let year, month, day;
        
        // Formato MM/DD/YYYY o DD/MM/YYYY
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                // Detectar si es MM/DD/YYYY o DD/MM/YYYY
                const first = parseInt(parts[0]);
                const second = parseInt(parts[1]);
                
                if (first > 12) {
                    // Debe ser DD/MM/YYYY
                    day = first;
                    month = second - 1;
                    year = parseInt(parts[2]);
                } else if (second > 12) {
                    // Debe ser MM/DD/YYYY
                    month = first - 1;
                    day = second;
                    year = parseInt(parts[2]);
                } else {
                    // Ambiguo, asumir MM/DD/YYYY (Google Calendar)
                    month = first - 1;
                    day = second;
                    year = parseInt(parts[2]);
                }
            }
        }
        // Formato YYYY-MM-DD
        else if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                year = parseInt(parts[0]);
                month = parseInt(parts[1]) - 1;
                day = parseInt(parts[2]);
            }
        }
        // Formato YYYYMMDD
        else if (dateStr.length === 8 && !isNaN(dateStr)) {
            year = parseInt(dateStr.substr(0, 4));
            month = parseInt(dateStr.substr(4, 2)) - 1;
            day = parseInt(dateStr.substr(6, 2));
        }
        
        if (!year || month === undefined || !day) {
            return null;
        }

        // Crear fecha en formato YYYY-MM-DD
        const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        return formattedDate;
    } catch (error) {
        console.warn('Error parseando fecha:', dateStr, error);
        return null;
    }
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

function detectLevelFromTitle(title) {
    const lowerTitle = title.toLowerCase();
    
    // Buscar emojis o palabras clave
    if (title.includes('🟢') || lowerTitle.includes('[iniciación]') || lowerTitle.includes('[iniciacion]') || lowerTitle.includes('iniciación')) {
        return 'iniciacion';
    }
    if (title.includes('🟠') || lowerTitle.includes('[medio]')) {
        return 'medio';
    }
    if (title.includes('🔴') || lowerTitle.includes('[avanzado]')) {
        return 'avanzado';
    }
    if (title.includes('🔵') || lowerTitle.includes('[temático]') || lowerTitle.includes('[tematico]') || lowerTitle.includes('temático')) {
        return 'tematico';
    }
    
    return null;
}

function cleanCourseTitle(title) {
    // Eliminar emojis y etiquetas de nivel
    return title
        .replace(/🟢|🟠|🔴|🔵/g, '')
        .replace(/\[iniciación\]|\[iniciacion\]|\[medio\]|\[avanzado\]|\[temático\]|\[tematico\]/gi, '')
        .trim();
}

// ===================================
// IMPORTAR DESDE ARCHIVO ICS
// ===================================
function parseICSFile(icsContent) {
    const events = [];
    const lines = icsContent.split(/\r?\n/);
    let currentEvent = null;
    let currentProperty = '';
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Manejar líneas continuadas (empiezan con espacio o tab)
        while (i + 1 < lines.length && /^[\s\t]/.test(lines[i + 1])) {
            i++;
            line += lines[i].replace(/^[\s\t]/, '');
        }
        
        line = line.trim();
        
        if (line === 'BEGIN:VEVENT') {
            currentEvent = {
                summary: '',
                startDate: null,
                endDate: null,
                location: '',
                description: ''
            };
        } else if (line === 'END:VEVENT' && currentEvent) {
            if (currentEvent.summary && currentEvent.startDate) {
                // Extraer nivel del título
                const level = detectLevelFromTitle(currentEvent.summary);
                const cleanTitle = cleanCourseTitle(currentEvent.summary);
                
                // Extraer ubicación y ciudad
                const locationData = parseLocation(currentEvent.location);
                
                // Extraer información de la descripción
                const descriptionData = parseDescription(currentEvent.description);
                
                // Crear objeto de curso
                const course = {
                    id: generateId(),
                    name: cleanTitle,
                    startDate: currentEvent.startDate,
                    endDate: currentEvent.endDate || currentEvent.startDate,
                    location: locationData.location || descriptionData.location || 'Sede UGT',
                    city: locationData.city || descriptionData.city || '',
                    level: level || descriptionData.level || 'medio',
                    instructor: descriptionData.instructor || '',
                    notes: descriptionData.notes || currentEvent.description || ''
                };
                
                events.push(course);
            }
            currentEvent = null;
        } else if (currentEvent) {
            // Parsear propiedades del evento
            const colonIndex = line.indexOf(':');
            const semicolonIndex = line.indexOf(';');
            
            let key, value;
            if (semicolonIndex !== -1 && semicolonIndex < colonIndex) {
                // Propiedad con parámetros (ej: DTSTART;VALUE=DATE:20260315)
                key = line.substring(0, semicolonIndex);
                value = line.substring(colonIndex + 1);
            } else if (colonIndex !== -1) {
                // Propiedad simple (ej: SUMMARY:Título)
                key = line.substring(0, colonIndex);
                value = line.substring(colonIndex + 1);
            } else {
                continue;
            }
            
            switch (key.toUpperCase()) {
                case 'SUMMARY':
                    currentEvent.summary = unescapeICS(value);
                    break;
                case 'DTSTART':
                case 'DTSTART;VALUE=DATE':
                    currentEvent.startDate = parseICSDate(value);
                    break;
                case 'DTEND':
                case 'DTEND;VALUE=DATE':
                    currentEvent.endDate = parseICSDate(value);
                    break;
                case 'LOCATION':
                    currentEvent.location = unescapeICS(value);
                    break;
                case 'DESCRIPTION':
                    currentEvent.description = unescapeICS(value);
                    break;
            }
        }
    }
    
    console.log(`Parseados ${events.length} eventos del archivo ICS`);
    return events;
}

function parseICSDate(dateStr) {
    if (!dateStr) return null;
    
    try {
        // Limpiar formato
        dateStr = dateStr.replace(/[TZ]/g, '').trim();
        
        // Formatos posibles:
        // 20260315 (solo fecha)
        // 20260315T090000 (fecha y hora)
        // 20260315T090000Z (fecha y hora UTC)
        
        if (dateStr.length >= 8) {
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            
            // Formato YYYY-MM-DD
            return `${year}-${month}-${day}`;
        }
        
        return null;
    } catch (error) {
        console.warn('Error parseando fecha ICS:', dateStr, error);
        return null;
    }
}

function unescapeICS(text) {
    if (!text) return '';
    
    return text
        .replace(/\\n/g, ' ')
        .replace(/\\,/g, ',')
        .replace(/\\;/g, ';')
        .replace(/\\\\/g, '\\')
        .trim();
}

function parseGoogleCalendarDate(dateStr, timeStr) {
    if (!dateStr) return null;

    try {
        // Google Calendar exporta en formato MM/DD/YYYY
        const dateParts = dateStr.split('/');
        if (dateParts.length !== 3) return null;

        const month = parseInt(dateParts[0]) - 1; // Mes base 0
        const day = parseInt(dateParts[1]);
        const year = parseInt(dateParts[2]);

        // Crear fecha en formato YYYY-MM-DD
        const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        return formattedDate;
    } catch (error) {
        console.warn('Error parseando fecha:', dateStr, error);
        return null;
    }
}

function parseLocation(locationStr) {
    if (!locationStr) return { location: '', city: '' };

    // Intentar separar por coma (formato: "Sede UGT, Madrid")
    const parts = locationStr.split(',').map(p => p.trim());
    
    if (parts.length >= 2) {
        return {
            location: parts[0],
            city: parts[parts.length - 1]
        };
    }

    // Buscar palabras clave de ciudad
    const cities = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Zaragoza', 'Málaga', 'Murcia', 'Las Palmas', 'Palma'];
    const foundCity = cities.find(city => locationStr.includes(city));

    if (foundCity) {
        return {
            location: locationStr.replace(foundCity, '').trim(),
            city: foundCity
        };
    }

    return { location: locationStr, city: '' };
}

function parseDescription(description) {
    const data = {
        level: null,
        city: '',
        location: '',
        instructor: '',
        notes: description
    };

    if (!description) return data;

    // Buscar nivel
    if (/nivel:\s*iniciación/i.test(description)) data.level = 'iniciacion';
    else if (/nivel:\s*medio/i.test(description)) data.level = 'medio';
    else if (/nivel:\s*avanzado/i.test(description)) data.level = 'avanzado';
    else if (/nivel:\s*temático/i.test(description)) data.level = 'tematico';

    // Buscar ciudad
    const cityMatch = description.match(/ciudad:\s*([^\n|]+)/i);
    if (cityMatch) data.city = cityMatch[1].trim();

    // Buscar formador
    const instructorMatch = description.match(/formador[\/es]*:\s*([^\n|]+)/i);
    if (instructorMatch) data.instructor = instructorMatch[1].trim();

    return data;
}
