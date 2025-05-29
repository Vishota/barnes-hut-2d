interface Particle {
    x: number;
    y: number;
    charge: number;
}

type Vector2D = { x: number; y: number };
type LawFn = (particle: Particle, dx: number, dy: number, r: number) => Vector2D;

type Quadrant = 'tl' | 'tr' | 'bl' | 'br';

export class Boundary {
    constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number
    ) { }

    contains(particle: Particle): boolean {
        return (
            particle.x >= this.x - this.width / 2 &&
            particle.x < this.x + this.width / 2 &&
            particle.y >= this.y - this.height / 2 &&
            particle.y < this.y + this.height / 2
        );
    }

    intersects(range: Boundary): boolean {
        return !(
            range.x - range.width / 2 > this.x + this.width / 2 ||
            range.x + range.width / 2 < this.x - this.width / 2 ||
            range.y - range.height / 2 > this.y + this.height / 2 ||
            range.y + range.height / 2 < this.y - this.height / 2
        );
    }
}

class SubQuadTree {
    private center: { x: number; y: number };
    private trees: Record<Quadrant, QuadTree>;

    constructor(private boundary: Boundary) {
        const cx = boundary.x;
        const cy = boundary.y;
        const hw = boundary.width / 2;
        const hh = boundary.height / 2;
        this.center = { x: cx, y: cy };
        this.trees = {
            tl: new QuadTree(new Boundary(cx - hw / 2, cy - hh / 2, hw, hh)),
            tr: new QuadTree(new Boundary(cx + hw / 2, cy - hh / 2, hw, hh)),
            bl: new QuadTree(new Boundary(cx - hw / 2, cy + hh / 2, hw, hh)),
            br: new QuadTree(new Boundary(cx + hw / 2, cy + hh / 2, hw, hh))
        };
    }

    addPoint(particle: Particle): void {
        const vert = particle.y < this.center.y ? 't' : 'b';
        const hor = particle.x < this.center.x ? 'l' : 'r';
        const quad = (vert + hor) as Quadrant;
        this.trees[quad].addPoint(particle);
    }

    query(range: Boundary, found: Particle[]): void {
        for (const tree of Object.values(this.trees)) {
            tree.query(range, found);
        }
    }
}

export default class QuadTree {
    private particles = new Set<Particle>();
    private subtree: SubQuadTree | null = null;

    constructor(private boundary: Boundary, private capacity = 1) { }

    addPoint(particle: Particle): boolean {
        if (!this.boundary.contains(particle)) return false;
        if (this.particles.size < this.capacity) {
            this.particles.add(particle);
            return true;
        }
        if (!this.subtree) this.subdivide();
        this.subtree!.addPoint(particle);
        return true;
    }

    private subdivide(): void {
        this.subtree = new SubQuadTree(this.boundary);
        for (const p of this.particles) this.subtree.addPoint(p);
        this.particles.clear();
    }

    query(range: Boundary, found: Particle[] = []): Particle[] {
        if (!this.boundary.intersects(range)) return found;
        for (const p of this.particles) if (range.contains(p)) found.push(p);
        if (this.subtree) this.subtree.query(range, found);
        return found;
    }

    clear(): void {
        this.particles.clear();
        this.subtree = null;
    }

    computeField(
        x: number,
        y: number,
        law: LawFn,
        cutoff: number
    ): Vector2D {
        const range = new Boundary(x, y, cutoff * 2, cutoff * 2);
        const neighbors = this.query(range);
        const field: Vector2D = { x: 0, y: 0 };
        for (const p of neighbors) {
            const dx = p.x - x;
            const dy = p.y - y;
            const r = Math.hypot(dx, dy) + 1e-6;
            if (r > cutoff) continue;
            const contrib = law(p, dx, dy, r);
            field.x += contrib.x;
            field.y += contrib.y;
        }
        return field;
    }
}
