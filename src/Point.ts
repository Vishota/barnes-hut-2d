export default class Point {
    constructor(private _x = 0, private _y = 0) {}

    get x() {
        return this._x
    }
    get y() {
        return this._y
    }
    set x(value) {
        this._x = value
    }
    set y(value) {
        this._y = value
    }
}