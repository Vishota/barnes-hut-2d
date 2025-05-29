import QuadTree, { Boundary } from './QuadTree'

interface Particle {
  x: number
  y: number
  charge: number
}

interface Vector2D {
  x: number
  y: number
}

interface MassNode {
  x: number
  y: number
  totalCharge: number
}

export class BarnesHut {
  private tree: QuadTree
  private theta: number
  private massMap = new WeakMap<QuadTree, MassNode>()

  constructor(boundary: Boundary, private capacity = 1, theta = 0.5) {
    this.tree = new QuadTree(boundary, capacity)
    this.theta = theta
  }

  addParticle(p: Particle) {
    this.tree.addPoint(p)
  }

  clear() {
    this.tree.clear()
    this.massMap = new WeakMap()
  }

  computeField(x: number, y: number, law: (node: Particle | MassNode, dx: number, dy: number, r: number) => Vector2D, theta = this.theta): Vector2D {
    this.computeMass(this.tree)

    const walk = (node: QuadTree): Vector2D => {
      const nodeMass = this.massMap.get(node)
      if (!nodeMass) return { x: 0, y: 0 }

      const dx = nodeMass.x - x
      const dy = nodeMass.y - y
      const r = Math.hypot(dx, dy)

      const s = Math.max(node['boundary'].width, node['boundary'].height)

      if (!node['subtree'] && node['particles'].size === 1) {
        const p = Array.from(node['particles'])[0] as Particle
        if (p.x === x && p.y === y) return { x: 0, y: 0 }
        return law(p, p.x - x, p.y - y, Math.hypot(p.x - x, p.y - y))
      }

      if (r === 0 || s / r < theta || !node['subtree']) {
        return law(nodeMass, dx, dy, r)
      } else {
        const subtree = node['subtree']
        const results = Object.values(subtree['trees']).map(walk)
        return results.reduce((acc, vec) => {
          acc.x += vec.x
          acc.y += vec.y
          return acc
        }, { x: 0, y: 0 })
      }
    }

    return walk(this.tree)
  }

  private computeMass(node: QuadTree): MassNode {
    if (this.massMap.has(node)) return this.massMap.get(node)!

    if (!node['subtree']) {
      const particles = Array.from(node['particles']) as Particle[]
      const totalCharge = particles.reduce((sum, p) => sum + p.charge, 0)
      const x = particles.reduce((sum, p) => sum + p.x * p.charge, 0) / (totalCharge || 1)
      const y = particles.reduce((sum, p) => sum + p.y * p.charge, 0) / (totalCharge || 1)
      const result = { x, y, totalCharge }
      this.massMap.set(node, result)
      return result
    } else {
      const subtree = node['subtree']
      const nodes = Object.values(subtree['trees'])
      const masses = nodes.map(n => this.computeMass(n))
      const totalCharge = masses.reduce((sum, m) => sum + m.totalCharge, 0)
      const x = masses.reduce((sum, m) => sum + m.x * m.totalCharge, 0) / (totalCharge || 1)
      const y = masses.reduce((sum, m) => sum + m.y * m.totalCharge, 0) / (totalCharge || 1)
      const result = { x, y, totalCharge }
      this.massMap.set(node, result)
      return result
    }
  }
}
