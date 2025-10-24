const nameInput = document.getElementById('nameInput');
const createBtn = document.getElementById('createBtn');
const inputContainer = document.getElementById('inputContainer');
const heartContainer = document.getElementById('heartContainer');
const backBtn = document.getElementById('backBtn');
const canvas = document.getElementById('heartCanvas');
const ctx = canvas.getContext('2d');

let animationId;
let words = [];
let userName = '';
let isBuilding = true;
let buildProgress = 0;
let startMoving = false;
let particles = [];

// Configurar canvas
function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Crear partículas para el fondo
function createParticles() {
    particles = [];
    const particleCount = 100;
    
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.5 + 0.3,
            color: Math.random() > 0.5 ? 'rgba(255, 0, 0, ' : 'rgba(255, 100, 100, '
        });
    }
}

// Dibujar el fondo con efectos
function drawBackground() {
    // Fondo negro base
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar partículas flotantes
    particles.forEach((particle) => {
        // Actualizar posición
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Rebotar en los bordes
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
        
        // Dibujar partícula
        ctx.save();
        ctx.fillStyle = particle.color + particle.opacity + ')';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Efecto de brillo
        const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 3
        );
        gradient.addColorStop(0, particle.color + (particle.opacity * 0.8) + ')');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
    
    // Efecto de viñeta
    const vignette = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height * 0.3,
        canvas.width / 2, canvas.height / 2, canvas.height * 0.8
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Función para calcular si un punto está dentro del corazón
function isInsideHeart(x, y, centerX, centerY, scale) {
    // Normalizar coordenadas
    const dx = (x - centerX) / scale;
    const dy = (y - centerY) / scale;
    
    // Dos círculos superiores bien definidos
    const circleRadius = 0.6;
    const circleY = -0.6;
    const circleSeparation = 0.6;
    
    // Círculo izquierdo
    const leftCircleX = -circleSeparation;
    const leftDist = Math.sqrt(Math.pow(dx - leftCircleX, 2) + Math.pow(dy - circleY, 2));
    
    // Círculo derecho
    const rightCircleX = circleSeparation;
    const rightDist = Math.sqrt(Math.pow(dx - rightCircleX, 2) + Math.pow(dy - circleY, 2));
    
    // Si está dentro de alguno de los círculos superiores
    if (leftDist <= circleRadius || rightDist <= circleRadius) {
        // Excluir la parte superior de los círculos para que no se pasen
        if (dy < -0.6 - circleRadius) return false;
        return true;
    }
    
    // Parte media y inferior - forma triangular que conecta los círculos
    if (dy >= -0.6) {
        // Calcular el ancho máximo en esta altura
        // Comienza ancho y se estrecha hasta la punta
        const heightFromTop = dy + 0.6;
        const totalHeight = 1.8;
        const progress = heightFromTop / totalHeight;
        
        // Ancho inicial (donde terminan los círculos)
        const topWidth = 1.2;
        // La punta es un punto
        const bottomWidth = 0;
        
        // Interpolación para crear la forma triangular
        const currentWidth = topWidth * (1 - progress);
        
        // Verificar si está dentro del ancho permitido en esta altura
        if (dy <= 1.2 && Math.abs(dx) <= currentWidth) {
            return true;
        }
    }
    
    return false;
}

// Función para crear la forma del corazón con texto super denso
function createHeartShape() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = Math.min(canvas.width, canvas.height) / 4.5;
    
    words = [];
    
    // Crear líneas de texto muy juntas
    const lineHeight = 15; // Espacio entre líneas
    const rangeY = scale * 2.4;
    
    // Medir el ancho del texto
    ctx.font = `bold 14px monospace`;
    const charWidth = ctx.measureText('a').width;
    
    // Construir desde arriba hacia abajo
    for (let y = centerY - rangeY; y < centerY + rangeY; y += lineHeight) {
        // Buscar todas las secciones de esta línea que están dentro del corazón
        let segments = [];
        let inHeart = false;
        let segmentStart = null;
        
        // Escanear la línea para encontrar todos los segmentos
        for (let testX = centerX - scale * 1.5; testX <= centerX + scale * 1.5; testX += 1) {
            const isInside = isInsideHeart(testX, y, centerX, centerY, scale);
            
            if (isInside && !inHeart) {
                // Inicio de un nuevo segmento
                segmentStart = testX;
                inHeart = true;
            } else if (!isInside && inHeart) {
                // Fin de un segmento
                segments.push({ start: segmentStart, end: testX });
                inHeart = false;
            }
        }
        
        // Si terminamos dentro del corazón, cerrar el último segmento
        if (inHeart) {
            segments.push({ start: segmentStart, end: centerX + scale * 1.5 });
        }
        
        // Llenar cada segmento con texto
        segments.forEach(segment => {
            let currentX = segment.start;
            let charIndex = Math.floor(Math.random() * userName.length); // Empezar en posición aleatoria
            
            while (currentX <= segment.end) {
                const char = userName[charIndex % userName.length];
                
                words.push({
                    x: currentX,
                    y: y,
                    baseX: currentX,
                    baseY: y,
                    char: char,
                    visible: false,
                    size: 14,
                    lineY: y
                });
                
                currentX += charWidth;
                charIndex++;
            }
        });
    }
    
    // Ordenar palabras por posición Y para animación de arriba a abajo
    words.sort((a, b) => a.lineY - b.lineY);
}

// Animar el corazón
let time = 0;
function animate() {
    // Dibujar fondo con efectos
    drawBackground();
    
    // Fase 1: Construcción de arriba hacia abajo
    if (isBuilding) {
        buildProgress += 0.015; // Velocidad de construcción
        
        if (buildProgress >= 1) {
            buildProgress = 1;
            isBuilding = false;
            // Esperar un poco antes de empezar a mover
            setTimeout(() => {
                startMoving = true;
            }, 500);
        }
        
        const visibleCount = Math.floor(words.length * buildProgress);
        
        words.forEach((word, index) => {
            if (index < visibleCount) {
                word.visible = true;
            }
        });
    }
    
    // Fase 2: Movimiento después de construir
    if (startMoving) {
        time += 0.02;
    }
    
    // Dibujar todos los caracteres visibles
    words.forEach((word) => {
        if (!word.visible) return;
        
        let drawX = word.baseX;
        let drawY = word.baseY;
        
        // Aplicar movimiento solo después de construir
        if (startMoving) {
            const floatX = Math.sin(time + word.baseY * 0.01) * 2;
            const floatY = Math.cos(time + word.baseX * 0.01) * 2;
            drawX += floatX;
            drawY += floatY;
        }
        
        ctx.save();
        ctx.fillStyle = '#FF0000'; // Rojo puro como en la imagen
        ctx.font = `bold 15px monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // Sombra sutil
        ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
        ctx.shadowBlur = 5;
        
        ctx.fillText(word.char, drawX, drawY);
        ctx.restore();
    });
    
    animationId = requestAnimationFrame(animate);
}

// Event Listeners
createBtn.addEventListener('click', () => {
    userName = nameInput.value.trim();
    
    if (userName === '') {
        alert('Por favor, escribe un nombre');
        return;
    }
    
    // Resetear variables de animación
    isBuilding = true;
    buildProgress = 0;
    startMoving = false;
    time = 0;
    
    inputContainer.classList.add('hidden');
    heartContainer.classList.remove('hidden');
    
    setupCanvas();
    createParticles();
    createHeartShape();
    animate();
});

backBtn.addEventListener('click', () => {
    cancelAnimationFrame(animationId);
    heartContainer.classList.add('hidden');
    inputContainer.classList.remove('hidden');
    nameInput.value = '';
    isBuilding = true;
    buildProgress = 0;
    startMoving = false;
});

// Presionar Enter para crear
nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        createBtn.click();
    }
});

// Redimensionar canvas
window.addEventListener('resize', () => {
    if (!heartContainer.classList.contains('hidden')) {
        setupCanvas();
        createParticles();
        createHeartShape();
    }
});

