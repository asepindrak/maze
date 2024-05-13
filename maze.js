const fs = require('fs')

class Node {
    constructor(state, parent, action) {
        this.state = state
        this.parent = parent
        this.action = action
    }
}

class StackFrontier {
    constructor() {
        this.frontier = []
    }

    add(node) {
        this.frontier.push(node)
    }

    containsState(state) {
        return this.frontier.some(node => node.state === state)
    }

    isEmpty() {
        return this.frontier.length === 0
    }

    remove() {
        if (this.isEmpty()) {
            throw new Error("empty frontier")
        } else {
            return this.frontier.pop()
        }
    }
}

class QueueFrontier extends StackFrontier {
    remove() {
        if (this.isEmpty()) {
            throw new Error("empty frontier")
        } else {
            return this.frontier.shift()
        }
    }
}

class Maze {
    constructor(filename) {
        const contents = fs.readFileSync(filename, 'utf8')

        if ((contents.match(/A/g) || []).length !== 1) {
            throw new Error("maze must have exactly one start point")
        }
        if ((contents.match(/B/g) || []).length !== 1) {
            throw new Error("maze must have exactly one goal")
        }

        const lines = contents.split('\n')
        this.height = lines.length
        this.width = Math.max(...lines.map(line => line.length))

        this.walls = []
        lines.forEach((line, i) => {
            const row = []
            for (let j = 0; j < this.width; j++) {
                const char = line[j] || ' '
                if (char === 'A') {
                    this.start = [i, j]
                    row.push(false)
                } else if (char === 'B') {
                    this.goal = [i, j]
                    row.push(false)
                } else if (char === ' ') {
                    row.push(false)
                } else {
                    row.push(true)
                }
            }
            this.walls.push(row)
        })

        this.solution = null
    }

    print() {
        const solution = this.solution ? this.solution[1] : null
        console.log()
        this.walls.forEach((row, i) => {
            let line = ''
            row.forEach((col, j) => {
                if (col) {
                    line += '█'
                } else if (this.start[0] === i && this.start[1] === j) {
                    line += 'A'
                } else if (this.goal[0] === i && this.goal[1] === j) {
                    line += 'B'
                } else if (solution && solution.includes([i, j])) {
                    line += '*'
                } else {
                    line += ' '
                }
            })
            console.log(line)
        })
        console.log()
    }

    neighbors(state) {
        const [row, col] = state
        const candidates = [
            ["up", [row - 1, col]],
            ["down", [row + 1, col]],
            ["left", [row, col - 1]],
            ["right", [row, col + 1]]
        ]

        return candidates.filter(([action, [r, c]]) => {
            return r >= 0 && r < this.height && c >= 0 && c < this.width && !this.walls[r][c]
        })
    }

    solve() {
        this.numExplored = 0
        const start = new Node(this.start, null, null)
        const frontier = new StackFrontier()
        frontier.add(start)
        this.explored = new Set()

        while (true) {
            if (frontier.isEmpty()) {
                throw new Error("no solution")
            }

            let node = frontier.remove()
            this.numExplored++

            if (node.state[0] === this.goal[0] && node.state[1] === this.goal[1]) {
                const actions = []
                const cells = []
                while (node.parent !== null) {
                    actions.push(node.action)
                    cells.push(node.state)
                    node = node.parent
                }
                actions.reverse()
                cells.reverse()
                this.solution = [actions, cells]
                return
            }

            this.explored.add(node.state.toString())

            this.neighbors(node.state).forEach(([action, state]) => {
                if (!frontier.containsState(state) && !this.explored.has(state.toString())) {
                    const child = new Node(state, node, action)
                    frontier.add(child)
                }
            })
        }
    }
}

if (process.argv.length !== 3) {
    console.error("Usage: node maze.js maze.txt")
    process.exit(1)
}

const m = new Maze(process.argv[2])
console.log("Maze:")
m.print()
console.log("Solving...")
m.solve()
console.log("States Explored:", m.numExplored)
console.log("Solution:")
m.print();

