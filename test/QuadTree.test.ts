import { describe, it, expect, beforeEach } from 'vitest'
import QuadTree, { Boundary } from '../src/QuadTree'

interface Particle {
    x: number
    y: number
    charge: number
}

const coulombLaw = (p: Particle, dx: number, dy: number, r: number) => {
    const factor = p.charge / (r * r)
    return { x: factor * dx / r, y: factor * dy / r }
}

describe('QuadTree basic field computation', () => {
    let tree: QuadTree

    beforeEach(() => {
        tree = new QuadTree(new Boundary(0, 0, 100, 100))
    })

    it('should compute simple electric field from one particle', () => {
        const p: Particle = { x: 10, y: 10, charge: 10 }
        tree.addPoint(p)

        const field = tree.computeField(20, 10, coulombLaw, 50)

        expect(field.x).toBeLessThan(0)
        expect(Math.abs(field.y)).toBeLessThan(1e-6)
    })

    it('should return zero vector when no particles are in range', () => {
        const field = tree.computeField(0, 0, coulombLaw, 10)
        expect(field).toEqual({ x: 0, y: 0 })
    })

    it('should accumulate multiple particles\' influence with positive net vertical force', () => {
        tree.addPoint({ x: -10, y: 10, charge: 10 })
        tree.addPoint({ x: 10, y: 10, charge: 10 })

        const field = tree.computeField(0, 0, coulombLaw, 50)

        expect(field.y).toBeGreaterThan(0)
        expect(Math.abs(field.x)).toBeLessThan(1e-6)
    })

})
