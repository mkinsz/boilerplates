'use strict'

const NEAR = 6;

export const isset = (o) => ('undefined' !== typeof o);
export const useor = (a, b, f = isset) => (f(a) ? a : b);
export const isbool = (b) => ('boolean' === typeof b);
export const tobool = (b) => (b ? true : false);
export const isnum = (n) => (!isNaN(n));
export const tonum = (n) => parseFloat(n);
export const isint = (n) => (isnum(n) && n === (n | 0));
export const isstr = (s) => ('string' === typeof s || (isset(s) && (s instanceof String)));
export const tostr = (s) => (isset(s) ? s.toString() : '');
export const isfunc = (f) => ('function' === typeof f);
export const isarray = (a) => (isset(a) && Array.isArray(a));
export const arrayable = (a) => (a && isint(a.length) && 0 <= a.length);
export const toarray = (a) => Array.prototype.slice.call(a);
export const objKeys = (o) => Object.keys(o);
export const objForEach = (o, f = (() => { }), t = this) => objKeys(o).forEach((p) => f.call(t, o[p], p, o));
export const objReduce = (o, f = (() => { }), r) => objKeys(o).reduce((r, p) => f(r, o[p], p, o), r);
export const objMap = (o, f = (() => { }), t = this) => objReduce(o, (r, v, p) => ({ ...r, [p]: f.call(t, v, p, o) }), {});
export const objValues = (o) => objReduce(o, (a, v) => a.concat([v]), []);
export const iselem = (e) => (isset(e) && (e instanceof Element || e instanceof Window || e instanceof Document));
export const getStyle = (d) => (d.currentStyle || window.getComputedStyle(d));
export const stdDoms = (...doms) => doms.reduce((arr, dom) => {
    if (iselem(dom)) {
        return (arr.includes(dom) ? arr : arr.concat(dom));
    } else if (isarray(dom)) {
        return dom.reduce((a, d) => a.concat(stdDoms(d)), arr);
    } else if (arrayable(dom)) {
        return arr.concat(stdDoms(toarray(dom)));
    } else {
        throw new Error(`Invalid element: ${tostr(dom)}`);
    }
}, []);

const magnet = (rect, move, xs, ys, ratio) => {
    const nr = { ...rect }
    const dst = Math.round(NEAR / ratio)
    if (move) {
        xs.some(m => (Math.abs(m - nr.l) < dst) && (nr.l = m))
        xs.some(m => (Math.abs(m - nr.r) < dst) && (nr.l = m - nr.w))
        ys.some(m => (Math.abs(m - nr.t) < dst) && (nr.t = m))
        ys.some(m => (Math.abs(m - nr.b) < dst) && (nr.t = m - nr.h))
    } else {
        xs.some(m => (Math.abs(m - nr.l) < dst) && (nr.l = m, nr.w = nr.r - m))
        xs.some(m => (Math.abs(m - nr.r) < dst) && (nr.r = m, nr.w = m - nr.l))
        ys.some(m => (Math.abs(m - nr.t) < dst) && (nr.t = m, nr.h = nr.b - m))
        ys.some(m => (Math.abs(m - nr.b) < dst) && (nr.b = m, nr.h = m - nr.t))
    }
    return nr
}

const boom = (rect, pos, xs, ys, xms, yms) => {
    let nr = stretchs(rect, xs, ys)
    if (nr.l == rect.l && nr.r == rect.r
        && nr.t == rect.t && nr.b == rect.b) {
        nr = shrinks(pos, rect, xms, yms)
    }
    return nr;
}

const stretchs = (rect, xs, ys) => {
    const nr = { ...rect }
    const x = xs.findIndex((m, i, a) => (nr.l >= m) && (a[i + 1] >= nr.r))
    const y = ys.findIndex((m, i, a) => (nr.t >= m) && (a[i + 1] >= nr.b))
    nr.l = x < 0 ? nr.l : xs[x]
    nr.r = x < 0 ? nr.r : xs[x + 1]
    nr.t = y < 0 ? nr.t : ys[y]
    nr.b = y < 0 ? nr.b : ys[y + 1]
    nr.w = x < 0 ? nr.w : nr.r - nr.l
    nr.h = x < 0 ? nr.h : nr.b - nr.t
    return nr
}

const shrinks = (pos, rect, xs, ys) => {
    const nr = { ...rect }
    const x = xs.findIndex((m, i, a) => (pos.x >= m) && (a[i + 1] >= pos.x))
    const y = ys.findIndex((m, i, a) => (pos.y >= m) && (a[i + 1] >= pos.y))
    nr.l = x < 0 ? nr.l : xs[x]
    nr.r = x < 0 ? nr.r : xs[x + 1]
    nr.t = y < 0 ? nr.t : ys[y]
    nr.b = y < 0 ? nr.b : ys[y + 1]
    nr.w = x < 0 ? nr.w : nr.r - nr.l
    nr.h = x < 0 ? nr.h : nr.b - nr.t
    return nr
}

const shrink2single = (pos, xs, ys) => {
    const xi = xs.findIndex((m, i, a) => ((pos.x >= m) && (pos.x < a[i + 1])))
    const yi = ys.findIndex((m, i, a) => ((pos.y >= m) && (pos.y < a[i + 1])))

    const tw = Math.abs(xs[xi + 1] - xs[xi])
    const th = Math.abs(ys[yi + 1] - ys[yi])

    const l = xs[xi] || 0
    const t = ys[yi] || 0
    const w = isnum(tw) ? tw : (xs[1] - xs[0])
    const h = isnum(th) ? th : (ys[1] - ys[0])

    return { l, t, w, h }
}

const shrink2own = (rect, xs, ys) => {
    const { l, t, r, b } = rect;

    const xlt = xs.findIndex((m, i, a) => (l >= m) && (l < a[i + 1]))
    const ylt = ys.findIndex((m, i, a) => (t >= m) && (t < a[i + 1]))
    const xrb = xs.findIndex((m, i, a) => (r > m) && (r <= a[i + 1]))
    const yrb = ys.findIndex((m, i, a) => (b > m) && (b <= a[i + 1]))

    const tw = xs[xrb + 1] - xs[xlt];
    const th = ys[yrb + 1] - ys[ylt];

    return { l: xs[xlt] || 0, t: ys[ylt] || 0, w: isnum(tw) ? tw : 0, h: isnum(th) ? th : 0 }
}

export { magnet, boom, shrink2single, shrink2own }