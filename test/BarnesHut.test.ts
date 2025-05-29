import { describe, it, expect } from 'vitest'
import { BarnesHut } from '../src/BarnesHut'
import { Boundary } from '../src/QuadTree'

const coulombLaw = (node: { charge?: number; totalCharge?: number }, dx: number, dy: number, r: number) => {
    const k = 1
    const q = 'charge' in node ? node.charge! : node.totalCharge!
    const magnitude = k * q / (r * r + 1e-6)
    return {
        x: (dx / r) * magnitude,
        y: (dy / r) * magnitude
    }
}

describe('BarnesHut', () => {
    it('computes field from multiple particles', () => {
        const bh = new BarnesHut(new Boundary(0, 0, 1000, 1000), 1, 0.5)

        bh.addParticle({ x: 100, y: 100, charge: 5 })
        bh.addParticle({ x: 200, y: 100, charge: -3 })
        bh.addParticle({ x: 150, y: 200, charge: 2 })

        const field = bh.computeField(150, 150, coulombLaw)

        expect(field.x).toBeTypeOf('number')
        expect(field.y).toBeTypeOf('number')
        expect(Math.abs(field.x)).toBeGreaterThan(0)
        expect(Math.abs(field.y)).toBeGreaterThan(0)
    })

    it('handles zero particles gracefully', () => {
        const bh = new BarnesHut(new Boundary(0, 0, 1000, 1000));
        const field = bh.computeField(500, 500, coulombLaw);
        expect(field.x).toBeCloseTo(0);
        expect(field.y).toBeCloseTo(0);
    });


    it('ignores self-contribution at the same point', () => {
        const bh = new BarnesHut(new Boundary(0, 0, 1000, 1000))
        bh.addParticle({ x: 300, y: 300, charge: 10 })
        const field = bh.computeField(300, 300, coulombLaw)
        expect(field.x).toBeCloseTo(0)
        expect(field.y).toBeCloseTo(0)
    })
})
