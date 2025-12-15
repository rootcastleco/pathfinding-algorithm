// A* Pathfinding Algorithm Visualizer
class Pathfinder {
    constructor() {
        this.grid = [];
        this.rows = 25;
        this.cols = 25;
        this.startNode = null;
        this.endNode = null;
        this.isRunning = false;
        this.animationSpeed = 50;
        this.allowDiagonal = true;
        this.isMouseDown = false;
        this.obstacleMode = 'place';
        
        this.init();
    }

    init() {
        this.createGrid();
        this.setupEventListeners();
        this.setDefaultPoints();
    }

    createGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        this.grid = [];

        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.title = `Row: ${row}, Col: ${col}`;
                
                gridElement.appendChild(cell);
                
                this.grid[row][col] = {
                    row,
                    col,
                    element: cell,
                    isStart: false,
                    isEnd: false,
                    isObstacle: false,
                    isVisited: false,
                    isPath: false,
                    g: Infinity,
                    h: 0,
                    f: Infinity,
                    previous: null
                };
            }
        }
    }

    setDefaultPoints() {
        // Set start point (top-left)
        this.setStartPoint(10, 5);
        
        // Set end point (bottom-right)
        this.setEndPoint(10, 20);
    }

    setStartPoint(row, col) {
        if (this.startNode) {
            this.startNode.isStart = false;
            this.startNode.element.classList.remove('start');
        }
        
        this.startNode = this.grid[row][col];
        this.startNode.isStart = true;
        this.startNode.element.classList.add('start');
        this.startNode.element.textContent = 'S';
    }

    setEndPoint(row, col) {
        if (this.endNode) {
            this.endNode.isEnd = false;
            this.endNode.element.classList.remove('end');
        }
        
        this.endNode = this.grid[row][col];
        this.endNode.isEnd = true;
        this.endNode.element.classList.add('end');
        this.endNode.element.textContent = 'E';
    }

    setupEventListeners() {
        // Button event listeners
        document.getElementById('startBtn').addEventListener('click', () => this.startAlgorithm());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearGrid());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetPath());

        // Speed slider
        const speedSlider = document.getElementById('speedSlider');
        speedSlider.addEventListener('input', (e) => {
            this.animationSpeed = parseInt(e.target.value);
            document.getElementById('speedValue').textContent = this.animationSpeed;
        });

        // Diagonal toggle
        document.getElementById('diagonalToggle').addEventListener('change', (e) => {
            this.allowDiagonal = e.target.checked;
        });

        // Grid interaction event listeners
        const gridElement = document.getElementById('grid');
        gridElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        gridElement.addEventListener('mouseover', (e) => this.handleMouseOver(e));
        gridElement.addEventListener('mouseup', () => this.handleMouseUp());
        gridElement.addEventListener('mouseleave', () => this.handleMouseUp());
    }

    handleMouseDown(e) {
        if (this.isRunning) return;
        
        const cell = e.target;
        if (!cell.classList.contains('cell')) return;
        
        this.isMouseDown = true;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const node = this.grid[row][col];
        
        if (node.isStart) {
            this.draggingStart = true;
        } else if (node.isEnd) {
            this.draggingEnd = true;
        } else {
            this.obstacleMode = node.isObstacle ? 'remove' : 'place';
            this.toggleObstacle(row, col);
        }
    }

    handleMouseOver(e) {
        if (!this.isMouseDown || this.isRunning) return;
        
        const cell = e.target;
        if (!cell.classList.contains('cell')) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (this.draggingStart) {
            if (!this.grid[row][col].isEnd && !this.grid[row][col].isObstacle) {
                this.setStartPoint(row, col);
            }
        } else if (this.draggingEnd) {
            if (!this.grid[row][col].isStart && !this.grid[row][col].isObstacle) {
                this.setEndPoint(row, col);
            }
        } else {
            this.toggleObstacle(row, col);
        }
    }

    handleMouseUp() {
        this.isMouseDown = false;
        this.draggingStart = false;
        this.draggingEnd = false;
    }

    toggleObstacle(row, col) {
        const node = this.grid[row][col];
        if (node.isStart || node.isEnd) return;
        
        if (this.obstacleMode === 'place' && !node.isObstacle) {
            node.isObstacle = true;
            node.element.classList.add('obstacle');
        } else if (this.obstacleMode === 'remove' && node.isObstacle) {
            node.isObstacle = false;
            node.element.classList.remove('obstacle');
        }
    }

    // A* Algorithm Implementation
    async startAlgorithm() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        document.getElementById('startBtn').disabled = true;
        
        const startTime = performance.now();
        this.resetPath();
        
        const result = await this.aStarAlgorithm();
        
        const endTime = performance.now();
        const timeElapsed = Math.round(endTime - startTime);
        document.getElementById('timeElapsed').textContent = `${timeElapsed}ms`;
        
        if (result.success) {
            this.animatePath(result.path);
            this.showMessage('Path found successfully!', 'success');
        } else {
            this.showMessage('No path found!', 'error');
        }
        
        this.isRunning = false;
        document.getElementById('startBtn').disabled = false;
    }

    async aStarAlgorithm() {
        const openSet = [this.startNode];
        const closedSet = new Set();
        let nodesVisited = 0;
        
        this.startNode.g = 0;
        this.startNode.h = this.heuristic(this.startNode, this.endNode);
        this.startNode.f = this.startNode.g + this.startNode.h;
        
        while (openSet.length > 0) {
            // Find node with lowest f score
            let current = openSet.reduce((lowest, node) => 
                node.f < lowest.f ? node : lowest
            );
            
            // Remove current from open set and add to closed set
            openSet.splice(openSet.indexOf(current), 1);
            closedSet.add(current);
            
            // Visualize current node
            if (!current.isStart && !current.isEnd) {
                current.element.classList.add('current');
                await this.delay();
                current.element.classList.remove('current');
                current.element.classList.add('visited');
            }
            
            nodesVisited++;
            document.getElementById('nodesVisited').textContent = nodesVisited;
            
            // Check if we reached the end
            if (current === this.endNode) {
                return {
                    success: true,
                    path: this.reconstructPath(current)
                };
            }
            
            // Check neighbors
            const neighbors = this.getNeighbors(current);
            
            for (const neighbor of neighbors) {
                if (closedSet.has(neighbor) || neighbor.isObstacle) continue;
                
                const tentativeG = current.g + this.distance(current, neighbor);
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                } else if (tentativeG >= neighbor.g) {
                    continue;
                }
                
                neighbor.previous = current;
                neighbor.g = tentativeG;
                neighbor.h = this.heuristic(neighbor, this.endNode);
                neighbor.f = neighbor.g + neighbor.h;
            }
        }
        
        return { success: false, path: [] };
    }

    heuristic(nodeA, nodeB) {
        // Manhattan distance or Euclidean distance
        if (this.allowDiagonal) {
            // Euclidean distance
            const dx = Math.abs(nodeA.col - nodeB.col);
            const dy = Math.abs(nodeA.row - nodeB.row);
            return Math.sqrt(dx * dx + dy * dy);
        } else {
            // Manhattan distance
            return Math.abs(nodeA.col - nodeB.col) + Math.abs(nodeA.row - nodeB.row);
        }
    }

    distance(nodeA, nodeB) {
        if (this.allowDiagonal) {
            const dx = Math.abs(nodeA.col - nodeB.col);
            const dy = Math.abs(nodeA.row - nodeB.row);
            // Diagonal movement costs more
            return dx === 1 && dy === 1 ? 1.414 : 1;
        }
        return 1;
    }

    getNeighbors(node) {
        const neighbors = [];
        const directions = this.allowDiagonal ? 
            [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]] :
            [[-1, 0], [0, -1], [0, 1], [1, 0]];
        
        for (const [dRow, dCol] of directions) {
            const newRow = node.row + dRow;
            const newCol = node.col + dCol;
            
            if (this.isValidPosition(newRow, newCol)) {
                neighbors.push(this.grid[newRow][newCol]);
            }
        }
        
        return neighbors;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    reconstructPath(node) {
        const path = [];
        let current = node;
        
        while (current !== null) {
            path.unshift(current);
            current = current.previous;
        }
        
        return path;
    }

    async animatePath(path) {
        const pathLength = path.length;
        document.getElementById('pathLength').textContent = pathLength;
        
        // Animate path nodes
        for (let i = 1; i < path.length - 1; i++) {
            const node = path[i];
            node.isPath = true;
            node.element.classList.add('path');
            await this.delay(100);
        }
    }

    delay(ms = null) {
        const delayTime = ms !== null ? ms : Math.max(1, 101 - this.animationSpeed);
        return new Promise(resolve => setTimeout(resolve, delayTime));
    }

    clearGrid() {
        this.resetPath();
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                if (!node.isStart && !node.isEnd && node.isObstacle) {
                    node.isObstacle = false;
                    node.element.classList.remove('obstacle');
                }
            }
        }
    }

    resetPath() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                
                // Reset node properties
                node.isVisited = false;
                node.isPath = false;
                node.g = Infinity;
                node.h = 0;
                node.f = Infinity;
                node.previous = null;
                
                // Reset visual states
                node.element.classList.remove('visited', 'path', 'current');
            }
        }
        
        // Reset stats
        document.getElementById('nodesVisited').textContent = '0';
        document.getElementById('pathLength').textContent = '0';
        document.getElementById('timeElapsed').textContent = '0ms';
        
        // Clear messages
        this.clearMessages();
    }

    showMessage(text, type) {
        this.clearMessages();
        
        const message = document.createElement('div');
        message.className = `${type}-message`;
        message.textContent = text;
        
        const visualizationArea = document.querySelector('.visualization-area');
        visualizationArea.insertBefore(message, visualizationArea.firstChild);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    clearMessages() {
        const messages = document.querySelectorAll('.success-message, .error-message');
        messages.forEach(msg => msg.remove());
    }
}

// Initialize the pathfinder when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Pathfinder();
});

// Add some additional utility functions
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomMaze(pathfinder) {
    pathfinder.clearGrid();
    
    const obstacleProbability = 0.3;
    for (let row = 0; row < pathfinder.rows; row++) {
        for (let col = 0; col < pathfinder.cols; col++) {
            const node = pathfinder.grid[row][col];
            if (!node.isStart && !node.isEnd && Math.random() < obstacleProbability) {
                node.isObstacle = true;
                node.element.classList.add('obstacle');
            }
        }
    }
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                document.getElementById('startBtn').click();
                break;
            case 'c':
                e.preventDefault();
                document.getElementById('clearBtn').click();
                break;
            case 'r':
                e.preventDefault();
                document.getElementById('resetBtn').click();
                break;
        }
    }
});

// Add touch support for mobile devices
let touchStartNode = null;

document.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && element.classList.contains('cell')) {
        touchStartNode = element;
        element.dispatchEvent(new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: touch.clientX,
            clientY: touch.clientY
        }));
    }
});

document.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && element.classList.contains('cell')) {
        element.dispatchEvent(new MouseEvent('mouseover', {
            bubbles: true,
            cancelable: true,
            clientX: touch.clientX,
            clientY: touch.clientY
        }));
    }
});

document.addEventListener('touchend', (e) => {
    if (touchStartNode) {
        touchStartNode.dispatchEvent(new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true
        }));
        touchStartNode = null;
    }
});

// Performance monitoring
const performanceMonitor = {
    startTime: 0,
    endTime: 0,
    
    start() {
        this.startTime = performance.now();
    },
    
    end() {
        this.endTime = performance.now();
        return this.endTime - this.startTime;
    }
};

// Export for potential external use
window.Pathfinder = Pathfinder;
window.generateRandomMaze = generateRandomMaze;