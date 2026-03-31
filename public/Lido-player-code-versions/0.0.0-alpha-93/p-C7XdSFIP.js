const t = () => {},
  e =
    "@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap'); @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400..800&display=swap'); @import url('https://fonts.googleapis.com/css2?family=Baloo+Bhai+2:wght@400..800&display=swap'); body{overflow:hidden;background-position:center;background-size:cover;background-repeat:no-repeat;height:100vh}*{user-select:none}.lido-disable-check-button{pointer-events:none;background-color:#9393935c !important;color:white}.lido-element-selected{border:2px solid;background-color:#ffdf7d !important}.diagonal-target,.diagonal-drop *{transform:scale(0.8) !important;opacity:1 !important}.cloned-element{display:flex !important;position:absolute !important;filter:grayscale(100%);pointer-events:none}.removeShadow{box-shadow:0px 0px 0px 0px #ff8900 !important}.highlight-element{border:2px solid white;box-shadow:rgb(243, 77, 8) 0px 0px 40px !important}.drop-element.empty{border:4px dashed #f34d08 !important}.drop-element.filled{border:'none' !important}.drag-element{box-shadow:0px 15px 11px rgba(43, 0, 0, 0.3) !important}.drag-element.dropped{box-shadow:none !important}.click-element{background-color:var(--btn-bg-color, rgba(255, 172, 76, 1)) !important;box-shadow:var(--btn-shadow-px) var(--btn-shadow-color, rgba(225, 121, 76, 1)) !important;cursor:pointer;transition:box-shadow 0.1s ease-out, transform 0.2s ease-out;}.click-element:active{box-shadow:0px 0px 0px var(--btn-shadow-color, rgba(225, 121, 76, 1)) !important;transform:translateY(var(--btn-active));}.click-element:focus{outline:2px solid dodgerblue;outline-offset:3px}.after-drop-popup-container{width:200%;height:200%;background-color:rgba(0, 0, 0, 0.8);position:absolute;display:flex;flex-direction:row-reverse;align-items:center;justify-content:center !important;gap:80px}.after-drop-popup-drag-element{scale:1.5;border-radius:8px;transform:none !important;position:unset !important}.after-drop-popup-drop-element{scale:1.5;border:unset;border-radius:8px;transform:none !important;position:unset !important}@keyframes zoomFadeIn{0%{transform:scale(0.6);opacity:0}100%{transform:scale(1);opacity:1}}.zoom-fade-in{animation:zoomFadeIn 0.8s ease-out forwards}@keyframes zoomFadeOut{0%{transform:scale(1);opacity:1}100%{transform:scale(0.6);opacity:0}}.zoom-fade-out{animation:zoomFadeOut 0.8s ease-in forwards}.slide-numbers{width:70px;height:70px;border:1px solid #f57139;background-color:white;font-weight:500;color:#f57139;font-size:44px;border-radius:40px;display:flex;align-items:center;justify-content:center;font-family:'Baloo Bhai 2', serif}.slide-numbers-bottom{position:absolute;display:flex;justify-content:space-around;align-items:center;bottom:-25px;width:100%;height:50px}.slide-numbers-left{position:absolute;display:flex;flex-direction:column;justify-content:space-around;height:100%;width:50px;left:-25px;bottom:0px}.lido-speak-icon{width:56px;height:56px;position:absolute;top:-25px;right:-25px;z-index:10;background-image:url(\"https://aeakbcdznktpsbrfsgys.supabase.co/storage/v1/object/public/template-assets/template/audioIcon.png\");background-color:white;border:4px solid #F34D08;border-radius:16px;box-shadow:0px 4px 0px 0px #F34D08;background-size:contain;background-repeat:no-repeat;cursor:pointer}.lido-speak-icon:active{transform:translateY(8px);box-shadow:0px 0px 0px 0px !important}.lido-strong-shake{animation:strongShake 0.3s ease}.lido-scaled-shake{animation:scaledShake 0.6s ease-in-out}.lido-horizontal-shake{animation:horizontalShake 0.6s ease-in-out;border-radius:20px}.lido-vertical-shake{animation:verticalShake 0.6s ease-in-out;border-radius:20px}.lido-diagonal-shake{animation:diagonalShake 0.5s ease-in-out;border-radius:20px;will-change:transform}.lido-glow{animation:glowPulse 1s infinite alternate;transition:opacity 0.5s ease-in-out}.lido-box-highlight{animation:topToPlace 0.3s linear}.lido-display-hiddenvalue{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:80px;font-weight:1000;color:brown;-webkit-text-stroke:2px white;font-family:'Baloo Bhai 2', sans-serif;pointer-events:none}.lido-image-colorize{position:relative;display:inline-block}.lido-image-colorize::after{content:'';position:absolute;inset:0;background:var(--tint-color);mix-blend-mode:multiply;opacity:0.8;pointer-events:none;mask-image:var(--mask-url);mask-size:cover;mask-repeat:no-repeat;mask-position:center}.lido-tts-highlight-overlay{position:fixed;pointer-events:none;z-index:9999;background:linear-gradient(\r\n    180deg,\r\n    rgba(255, 235, 59, 0.95),\r\n    rgba(255, 214, 0, 0.95)\r\n  );border-radius:6px;box-shadow:0 2px 6px rgba(0, 0, 0, 0.18),\r\n    inset 0 -1px 0 rgba(255, 255, 255, 0.25);transition:left 55ms linear,\r\n    top 55ms linear,\r\n    width 55ms ease-out,\r\n    height 55ms ease-out,\r\n    opacity 80ms ease-out;opacity:0.95;will-change:transform, width, height}";
function o(t, e, o) {
  const n = 'undefined' != typeof HTMLElement ? HTMLElement.prototype : null;
  for (; t && t !== n; ) {
    const n = Object.getOwnPropertyDescriptor(t, e);
    if (n && (!o || n.get)) return n;
    t = Object.getPrototypeOf(t);
  }
}
var n,
  i = (t, e) => {
    var n;
    Object.entries(null != (n = e.o.t) ? n : {}).map(([n, [i]]) => {
      if (31 & i || 32 & i) {
        const i = t[n],
          l =
            o(Object.getPrototypeOf(t), n, !0) ||
            Object.getOwnPropertyDescriptor(t, n);
        (l &&
          Object.defineProperty(t, n, {
            get() {
              return l.get.call(this);
            },
            set(t) {
              l.set.call(this, t);
            },
            configurable: !0,
            enumerable: !0,
          }),
          e.i.has(n) ? (t[n] = e.i.get(n)) : void 0 !== i && (t[n] = i));
      }
    });
  },
  l = (t) => {
    if (t.__stencil__getHostRef) return t.__stencil__getHostRef();
  },
  s = (t, e) => {
    e &&
      ((t.__stencil__getHostRef = () => e), (e.l = t), 512 & e.o.u && i(t, e));
  },
  r = (t, e) => e in t,
  a = (t, e) => (0, console.error)(t, e),
  c = new Map(),
  u = new Map(),
  f = 'slot-fb{display:contents}slot-fb[hidden]{display:none}',
  d = 'http://www.w3.org/1999/xlink',
  p = 'undefined' != typeof window ? window : {},
  m = {
    u: 0,
    p: '',
    jmp: (t) => t(),
    raf: (t) => requestAnimationFrame(t),
    ael: (t, e, o, n) => t.addEventListener(e, o, n),
    rel: (t, e, o, n) => t.removeEventListener(e, o, n),
    ce: (t, e) => new CustomEvent(t, e),
  },
  h = (t) => Promise.resolve(t),
  b = (() => {
    try {
      return (
        !!p.document.adoptedStyleSheets &&
        (new CSSStyleSheet(),
        'function' == typeof new CSSStyleSheet().replaceSync)
      );
    } catch (t) {}
    return !1;
  })(),
  g =
    !!b &&
    (() =>
      !!p.document &&
      Object.getOwnPropertyDescriptor(p.document.adoptedStyleSheets, 'length')
        .writable)(),
  v = !1,
  y = [],
  w = [],
  x = (t, e) => (o) => {
    (t.push(o), v || ((v = !0), e && 4 & m.u ? S($) : m.raf($)));
  },
  k = (t) => {
    for (let e = 0; e < t.length; e++)
      try {
        t[e](performance.now());
      } catch (t) {
        a(t);
      }
    t.length = 0;
  },
  $ = () => {
    (k(y), k(w), (v = y.length > 0) && m.raf($));
  },
  S = (t) => h().then(t),
  j = x(w, !0),
  O = (t) => {
    const e = new URL(t, m.p);
    return e.origin !== p.location.origin ? e.href : e.pathname;
  };
function z() {
  var t;
  const o = this.attachShadow({ mode: 'open' });
  if (
    (void 0 === n &&
      (n =
        null !=
        (t = (function (t) {
          if (!b) return;
          const e = new CSSStyleSheet();
          return (e.replaceSync(t), e);
        })(e))
          ? t
          : null),
    n)
  )
    g
      ? o.adoptedStyleSheets.push(n)
      : (o.adoptedStyleSheets = [...o.adoptedStyleSheets, n]);
  else if (!b) {
    const t = document.createElement('style');
    ((t.innerHTML = e), o.prepend(t));
  }
}
var N = (t) => {
  const e = T(t, 'childNodes');
  t.tagName &&
    t.tagName.includes('-') &&
    t['s-cr'] &&
    'SLOT-FB' !== t.tagName &&
    C(e, t.tagName).forEach((t) => {
      1 === t.nodeType &&
        'SLOT-FB' === t.tagName &&
        (t.hidden = !!E(t, F(t), !1).length);
    });
  let o = 0;
  for (o = 0; o < e.length; o++) {
    const t = e[o];
    1 === t.nodeType && T(t, 'childNodes').length && N(t);
  }
};
function C(t, e, o) {
  let n,
    i = 0,
    l = [];
  for (; i < t.length; i++) {
    if (
      ((n = t[i]),
      n['s-sr'] &&
        (!e || n['s-hn'] === e) &&
        (void 0 === o || F(n) === o) &&
        (l.push(n), void 0 !== o))
    )
      return l;
    l = [...l, ...C(n.childNodes, e, o)];
  }
  return l;
}
var E = (t, e, o = !0) => {
    const n = [];
    ((o && t['s-sr']) || !t['s-sr']) && n.push(t);
    let i = t;
    for (; (i = i.nextSibling); ) F(i) !== e || (!o && i['s-sr']) || n.push(i);
    return n;
  },
  M = (t, e) =>
    1 === t.nodeType
      ? (null === t.getAttribute('slot') && '' === e) ||
        t.getAttribute('slot') === e
      : t['s-sn'] === e || '' === e,
  F = (t) =>
    'string' == typeof t['s-sn']
      ? t['s-sn']
      : (1 === t.nodeType && t.getAttribute('slot')) || void 0;
function T(t, e) {
  if ('__' + e in t) {
    const o = t['__' + e];
    return 'function' != typeof o ? o : o.bind(t);
  }
  return 'function' != typeof t[e] ? t[e] : t[e].bind(t);
}
function L(t) {
  var e, o, n;
  return null !=
    (n =
      null ==
      (o =
        null == (e = t.head)
          ? void 0
          : e.querySelector('meta[name="csp-nonce"]'))
        ? void 0
        : o.getAttribute('content'))
    ? n
    : void 0;
}
var R,
  B,
  P = new WeakMap(),
  A = (t) => 'sc-' + t.m,
  D = (t) => 'object' == (t = typeof t) || 'function' === t,
  H = (t, e, ...o) => {
    let n = null,
      i = null,
      l = null,
      s = !1,
      r = !1;
    const a = [],
      c = (e) => {
        for (let o = 0; o < e.length; o++)
          ((n = e[o]),
            Array.isArray(n)
              ? c(n)
              : null != n &&
                'boolean' != typeof n &&
                ((s = 'function' != typeof t && !D(n)) && (n += ''),
                s && r ? (a[a.length - 1].h += n) : a.push(s ? U(null, n) : n),
                (r = s)));
      };
    if ((c(o), e)) {
      (e.key && (i = e.key), e.name && (l = e.name));
      {
        const t = e.className || e.class;
        t &&
          (e.class =
            'object' != typeof t
              ? t
              : Object.keys(t)
                  .filter((e) => t[e])
                  .join(' '));
      }
    }
    const u = U(t, null);
    return ((u.v = e), a.length > 0 && (u.k = a), (u.$ = i), (u.S = l), u);
  },
  U = (t, e) => ({
    u: 0,
    j: t,
    h: null != e ? e : null,
    O: null,
    k: null,
    v: null,
    $: null,
    S: null,
  }),
  _ = {},
  I = (t, e) =>
    null == t || D(t)
      ? t
      : 4 & e
        ? 'false' !== t && ('' === t || !!t)
        : 2 & e
          ? 'string' == typeof t
            ? parseFloat(t)
            : 'number' == typeof t
              ? t
              : NaN
          : 1 & e
            ? t + ''
            : t,
  W = (t) => {
    var e;
    return null == (e = l(t)) ? void 0 : e.$hostElement$;
  },
  Y = (t, e) => {
    const o = W(t);
    return {
      emit: (t) =>
        V(o, e, { bubbles: !0, composed: !0, cancelable: !0, detail: t }),
    };
  },
  V = (t, e, o) => {
    const n = m.ce(e, o);
    return (t.dispatchEvent(n), n);
  },
  q = (t, e, o, n, i, s) => {
    if (o === n) return;
    let a = r(t, e),
      c = e.toLowerCase();
    if ('class' === e) {
      const e = t.classList,
        i = Z(o);
      let l = Z(n);
      (e.remove(...i.filter((t) => t && !l.includes(t))),
        e.add(...l.filter((t) => t && !i.includes(t))));
    } else if ('style' === e) {
      for (const e in o)
        (n && null != n[e]) ||
          (e.includes('-') ? t.style.removeProperty(e) : (t.style[e] = ''));
      for (const e in n)
        (o && n[e] === o[e]) ||
          (e.includes('-')
            ? t.style.setProperty(e, n[e])
            : (t.style[e] = n[e]));
    } else if ('key' === e);
    else if ('ref' === e) n && gt(n, t);
    else if (a || 'o' !== e[0] || 'n' !== e[1]) {
      if ('a' === e[0] && e.startsWith('attr:')) {
        const o = e.slice(5);
        let i;
        {
          const e = l(t);
          if (e && e.o && e.o.t) {
            const t = e.o.t[o];
            t && t[1] && (i = t[1]);
          }
        }
        return (
          i || (i = o.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()),
          void (null == n || !1 === n
            ? (!1 === n && '' !== t.getAttribute(i)) || t.removeAttribute(i)
            : t.setAttribute(i, !0 === n ? '' : n))
        );
      }
      if ('p' === e[0] && e.startsWith('prop:')) {
        const o = e.slice(5);
        try {
          t[o] = n;
        } catch (t) {}
        return;
      }
      {
        const l = D(n);
        if ((a || (l && null !== n)) && !i)
          try {
            if (t.tagName.includes('-')) t[e] !== n && (t[e] = n);
            else {
              const i = null == n ? '' : n;
              'list' === e
                ? (a = !1)
                : (null != o && t[e] === i) ||
                  ('function' == typeof t.__lookupSetter__(e)
                    ? (t[e] = i)
                    : t.setAttribute(e, i));
            }
          } catch (t) {}
        let r = !1;
        (c !== (c = c.replace(/^xlink\:?/, '')) && ((e = c), (r = !0)),
          null == n || !1 === n
            ? (!1 === n && '' !== t.getAttribute(e)) ||
              (r ? t.removeAttributeNS(d, e) : t.removeAttribute(e))
            : (!a || 4 & s || i) &&
              !l &&
              1 === t.nodeType &&
              ((n = !0 === n ? '' : n),
              r ? t.setAttributeNS(d, e, n) : t.setAttribute(e, n)));
      }
    } else if (
      ((e =
        '-' === e[2] ? e.slice(3) : r(p, c) ? c.slice(2) : c[2] + e.slice(3)),
      o || n)
    ) {
      const i = e.endsWith(J);
      ((e = e.replace(K, '')), o && m.rel(t, e, o, i), n && m.ael(t, e, n, i));
    }
  },
  G = /\s/,
  Z = (t) => (
    'object' == typeof t && t && 'baseVal' in t && (t = t.baseVal),
    t && 'string' == typeof t ? t.split(G) : []
  ),
  J = 'Capture',
  K = RegExp(J + '$'),
  Q = (t, e, o) => {
    const n = 11 === e.O.nodeType && e.O.host ? e.O.host : e.O,
      i = (t && t.v) || {},
      l = e.v || {};
    for (const t of X(Object.keys(i))) t in l || q(n, t, i[t], void 0, o, e.u);
    for (const t of X(Object.keys(l))) q(n, t, i[t], l[t], o, e.u);
  };
function X(t) {
  return t.includes('ref') ? [...t.filter((t) => 'ref' !== t), 'ref'] : t;
}
var tt = !1,
  et = !1,
  ot = !1,
  nt = !1,
  it = [],
  lt = [],
  st = (t, e, o) => {
    var n;
    const i = e.k[o];
    let l,
      s,
      r,
      a = 0;
    if (
      (tt || ((ot = !0), 'slot' === i.j && (i.u |= i.k ? 2 : 1)), null != i.h)
    )
      l = i.O = p.document.createTextNode(i.h);
    else if (1 & i.u)
      ((l = i.O = p.document.createTextNode('')), Q(null, i, nt));
    else {
      if (!p.document)
        throw Error(
          "You are trying to render a Stencil component in an environment that doesn't support the DOM.",
        );
      if (
        ((l = i.O = p.document.createElement(!tt && 2 & i.u ? 'slot-fb' : i.j)),
        Q(null, i, nt),
        i.k)
      ) {
        const e = 'template' === i.j ? l.content : l;
        for (a = 0; a < i.k.length; ++a)
          ((s = st(t, i, a)), s && e.appendChild(s));
      }
    }
    return (
      (l['s-hn'] = B),
      3 & i.u &&
        ((l['s-sr'] = !0),
        (l['s-cr'] = R),
        (l['s-sn'] = i.S || ''),
        (l['s-rf'] = null == (n = i.v) ? void 0 : n.ref),
        (function (t) {
          if (t.assignedElements || t.assignedNodes || !t['s-sr']) return;
          const e = (e) =>
            function (t) {
              const o = [],
                n = this['s-sn'];
              (null == t ? void 0 : t.flatten) &&
                console.error(
                  '\n          Flattening is not supported for Stencil non-shadow slots.\n          You can use `.childNodes` to nested slot fallback content.\n          If you have a particular use case, please open an issue on the Stencil repo.\n        ',
                );
              const i = this['s-cr'].parentElement;
              return (
                (i.__childNodes
                  ? i.childNodes
                  : ((t) => {
                      const e = [];
                      for (let o = 0; o < t.length; o++) {
                        const n = t[o]['s-nr'] || void 0;
                        n && n.isConnected && e.push(n);
                      }
                      return e;
                    })(i.childNodes)
                ).forEach((t) => {
                  n === F(t) && o.push(t);
                }),
                e ? o.filter((t) => 1 === t.nodeType) : o
              );
            }.bind(t);
          ((t.assignedElements = e(!0)), (t.assignedNodes = e(!1)));
        })(l),
        (r = t && t.k && t.k[o]),
        r && r.j === i.j && t.O && rt(t.O)),
      l
    );
  },
  rt = (t) => {
    m.u |= 1;
    const e = t.closest(B.toLowerCase());
    if (null != e) {
      const o = Array.from(e.__childNodes || e.childNodes).find(
          (t) => t['s-cr'],
        ),
        n = Array.from(t.__childNodes || t.childNodes);
      for (const t of o ? n.reverse() : n)
        null != t['s-sh'] &&
          (vt(e, t, null != o ? o : null), (t['s-sh'] = void 0), (ot = !0));
    }
    m.u &= -2;
  },
  at = (t, e) => {
    m.u |= 1;
    const o = Array.from(t.__childNodes || t.childNodes);
    if (t['s-sr']) {
      let e = t;
      for (; (e = e.nextSibling); )
        e && e['s-sn'] === t['s-sn'] && e['s-sh'] === B && o.push(e);
    }
    for (let t = o.length - 1; t >= 0; t--) {
      const n = o[t];
      (n['s-hn'] !== B &&
        n['s-ol'] &&
        (vt(dt(n).parentNode, n, dt(n)),
        n['s-ol'].remove(),
        (n['s-ol'] = void 0),
        (n['s-sh'] = void 0),
        (ot = !0)),
        e && at(n, e));
    }
    m.u &= -2;
  },
  ct = (t, e, o, n, i, l) => {
    let s,
      r = (t['s-cr'] && t['s-cr'].parentNode) || t;
    for (
      r.shadowRoot && r.tagName === B && (r = r.shadowRoot),
        'template' === o.j && (r = r.content);
      i <= l;
      ++i
    )
      n[i] && ((s = st(null, o, i)), s && ((n[i].O = s), vt(r, s, dt(e))));
  },
  ut = (t, e, o) => {
    for (let n = e; n <= o; ++n) {
      const e = t[n];
      if (e) {
        const t = e.O;
        (bt(e),
          t &&
            ((et = !0),
            t['s-ol'] ? t['s-ol'].remove() : at(t, !0),
            t.remove()));
      }
    }
  },
  ft = (t, e, o = !1) =>
    t.j === e.j &&
    ('slot' === t.j
      ? t.S === e.S
      : o
        ? (o && !t.$ && e.$ && (t.$ = e.$), !0)
        : t.$ === e.$),
  dt = (t) => (t && t['s-ol']) || t,
  pt = (t, e, o = !1) => {
    const n = (e.O = t.O),
      i = t.k,
      l = e.k,
      s = e.h;
    let r;
    null == s
      ? ('slot' !== e.j ||
          tt ||
          (t.S !== e.S && ((e.O['s-sn'] = e.S || ''), rt(e.O.parentElement))),
        Q(t, e, nt),
        null !== i && null !== l
          ? ((t, e, o, n, i = !1) => {
              let l,
                s,
                r = 0,
                a = 0,
                c = 0,
                u = 0,
                f = e.length - 1,
                d = e[0],
                p = e[f],
                m = n.length - 1,
                h = n[0],
                b = n[m];
              const g = 'template' === o.j ? t.content : t;
              for (; r <= f && a <= m; )
                if (null == d) d = e[++r];
                else if (null == p) p = e[--f];
                else if (null == h) h = n[++a];
                else if (null == b) b = n[--m];
                else if (ft(d, h, i)) (pt(d, h, i), (d = e[++r]), (h = n[++a]));
                else if (ft(p, b, i)) (pt(p, b, i), (p = e[--f]), (b = n[--m]));
                else if (ft(d, b, i))
                  (('slot' !== d.j && 'slot' !== b.j) || at(d.O.parentNode, !1),
                    pt(d, b, i),
                    vt(g, d.O, p.O.nextSibling),
                    (d = e[++r]),
                    (b = n[--m]));
                else if (ft(p, h, i))
                  (('slot' !== d.j && 'slot' !== b.j) || at(p.O.parentNode, !1),
                    pt(p, h, i),
                    vt(g, p.O, d.O),
                    (p = e[--f]),
                    (h = n[++a]));
                else {
                  for (c = -1, u = r; u <= f; ++u)
                    if (e[u] && null !== e[u].$ && e[u].$ === h.$) {
                      c = u;
                      break;
                    }
                  (c >= 0
                    ? ((s = e[c]),
                      s.j !== h.j
                        ? (l = st(e && e[a], o, c))
                        : (pt(s, h, i), (e[c] = void 0), (l = s.O)),
                      (h = n[++a]))
                    : ((l = st(e && e[a], o, a)), (h = n[++a])),
                    l && vt(dt(d.O).parentNode, l, dt(d.O)));
                }
              r > f
                ? ct(t, null == n[m + 1] ? null : n[m + 1].O, o, n, a, m)
                : a > m && ut(e, r, f);
            })(n, i, e, l, o)
          : null !== l
            ? (null !== t.h && (n.textContent = ''),
              ct(n, null, e, l, 0, l.length - 1))
            : !o && null !== i && ut(i, 0, i.length - 1))
      : (r = n['s-cr'])
        ? (r.parentNode.textContent = s)
        : t.h !== s && (n.data = s);
  },
  mt = [],
  ht = (t) => {
    let e, o, n;
    const i = t.__childNodes || t.childNodes;
    for (const t of i) {
      if (t['s-sr'] && (e = t['s-cr']) && e.parentNode) {
        o = e.parentNode.__childNodes || e.parentNode.childNodes;
        const i = t['s-sn'];
        for (n = o.length - 1; n >= 0; n--)
          if (
            ((e = o[n]),
            !(
              e['s-cn'] ||
              e['s-nr'] ||
              e['s-hn'] === t['s-hn'] ||
              (e['s-sh'] && e['s-sh'] === t['s-hn'])
            ))
          )
            if (M(e, i)) {
              let o = mt.find((t) => t.N === e);
              ((et = !0),
                (e['s-sn'] = e['s-sn'] || i),
                o
                  ? ((o.N['s-sh'] = t['s-hn']), (o.C = t))
                  : ((e['s-sh'] = t['s-hn']), mt.push({ C: t, N: e })),
                e['s-sr'] &&
                  mt.map((t) => {
                    M(t.N, e['s-sn']) &&
                      ((o = mt.find((t) => t.N === e)),
                      o && !t.C && (t.C = o.C));
                  }));
            } else mt.some((t) => t.N === e) || mt.push({ N: e });
      }
      1 === t.nodeType && ht(t);
    }
  },
  bt = (t) => {
    (t.v && t.v.ref && it.push(() => t.v.ref(null)), t.k && t.k.map(bt));
  },
  gt = (t, e) => {
    lt.push(() => t(e));
  },
  vt = (t, e, o, n) => {
    if ('string' == typeof e['s-sn']) {
      t.insertBefore(e, o);
      const { slotNode: i } = (function (t, e) {
        var o;
        if (!(e = e || (null == (o = t['s-ol']) ? void 0 : o.parentElement)))
          return { slotNode: null, slotName: '' };
        const n = (t['s-sn'] = F(t) || '');
        return {
          slotNode: C(T(e, 'childNodes'), e.tagName, n)[0],
          slotName: n,
        };
      })(e);
      return (
        i &&
          !n &&
          (function (t) {
            t.dispatchEvent(
              new CustomEvent('slotchange', {
                bubbles: !1,
                cancelable: !1,
                composed: !1,
              }),
            );
          })(i),
        e
      );
    }
    return t.__insertBefore
      ? t.__insertBefore(e, o)
      : null == t
        ? void 0
        : t.insertBefore(e, o);
  },
  yt = (t, e) => {
    if (e && !t.M && e['s-p']) {
      const o = e['s-p'].push(
        new Promise(
          (n) =>
            (t.M = () => {
              (e['s-p'].splice(o - 1, 1), n());
            }),
        ),
      );
    }
  },
  wt = (t, e) => {
    if (((t.u |= 16), 4 & t.u)) return void (t.u |= 512);
    yt(t, t.F);
    const o = () => xt(t, e);
    if (!e) return j(o);
    queueMicrotask(() => {
      o();
    });
  },
  xt = (t, e) => {
    const o = t.$hostElement$,
      n = t.l;
    if (!n)
      throw Error(
        `Can't render component <${o.tagName.toLowerCase()} /> with invalid Stencil runtime! Make sure this imported component is compiled with a \`externalRuntime: true\` flag. For more information, please refer to https://stenciljs.com/docs/custom-elements#externalruntime`,
      );
    let i;
    return (
      e
        ? (t.T && ((t.T = !1), Nt(n, 'connectedCallback', void 0, o)),
          t.L.length && t.L.forEach((t) => t(o)),
          (i = Nt(n, 'componentWillLoad', void 0, o)))
        : (i = Nt(n, 'componentWillUpdate', void 0, o)),
      (i = kt(i, () => Nt(n, 'componentWillRender', void 0, o))),
      kt(i, () => St(t, n, e))
    );
  },
  kt = (t, e) =>
    $t(t)
      ? t.then(e).catch((t) => {
          (console.error(t), e());
        })
      : e(),
  $t = (t) =>
    t instanceof Promise || (t && t.then && 'function' == typeof t.then),
  St = async (t, e, o) => {
    var n;
    const i = t.$hostElement$,
      l = i['s-rc'];
    o &&
      ((t) => {
        const e = t.o,
          o = t.$hostElement$,
          n = e.u,
          i = ((t, e) => {
            var o, n, i;
            const l = A(e),
              s = u.get(l);
            if (!p.document) return l;
            if (((t = 11 === t.nodeType ? t : p.document), s))
              if ('string' == typeof s) {
                let i,
                  r = P.get((t = t.head || t));
                if ((r || P.set(t, (r = new Set())), !r.has(l))) {
                  ((i = p.document.createElement('style')),
                    (i.textContent = s));
                  const a = null != (o = m.R) ? o : L(p.document);
                  if ((null != a && i.setAttribute('nonce', a), !(1 & e.u)))
                    if ('HEAD' === t.nodeName) {
                      const e = t.querySelectorAll('link[rel=preconnect]'),
                        o =
                          e.length > 0
                            ? e[e.length - 1].nextSibling
                            : t.querySelector('style');
                      t.insertBefore(
                        i,
                        (null == o ? void 0 : o.parentNode) === t ? o : null,
                      );
                    } else if ('host' in t)
                      if (b) {
                        const e = new (
                          null != (n = t.defaultView)
                            ? n
                            : t.ownerDocument.defaultView
                        ).CSSStyleSheet();
                        (e.replaceSync(s),
                          g
                            ? t.adoptedStyleSheets.unshift(e)
                            : (t.adoptedStyleSheets = [
                                e,
                                ...t.adoptedStyleSheets,
                              ]));
                      } else {
                        const e = t.querySelector('style');
                        e ? (e.textContent = s + e.textContent) : t.prepend(i);
                      }
                    else t.append(i);
                  (1 & e.u && t.insertBefore(i, null),
                    4 & e.u && (i.textContent += f),
                    r && r.add(l));
                }
              } else {
                let e = P.get(t);
                if ((e || P.set(t, (e = new Set())), !e.has(l))) {
                  const o =
                    null != (i = t.defaultView)
                      ? i
                      : t.ownerDocument.defaultView;
                  let n;
                  if (s.constructor === o.CSSStyleSheet) n = s;
                  else {
                    n = new o.CSSStyleSheet();
                    for (let t = 0; t < s.cssRules.length; t++)
                      n.insertRule(s.cssRules[t].cssText, t);
                  }
                  (g
                    ? t.adoptedStyleSheets.push(n)
                    : (t.adoptedStyleSheets = [...t.adoptedStyleSheets, n]),
                    e.add(l));
                }
              }
            return l;
          })(o.shadowRoot ? o.shadowRoot : o.getRootNode(), e);
        10 & n && ((o['s-sc'] = i), o.classList.add(i + '-h'));
      })(t);
    (jt(t, e, i, o), l && (l.map((t) => t()), (i['s-rc'] = void 0)));
    {
      const e = null != (n = i['s-p']) ? n : [],
        o = () => Ot(t);
      0 === e.length
        ? o()
        : (Promise.all(e).then(o).catch(o), (t.u |= 4), (e.length = 0));
    }
  },
  jt = (t, e, o, n) => {
    try {
      ((e = e.render()),
        (t.u &= -17),
        (t.u |= 2),
        ((t, e, o = !1) => {
          var n, i, l, s, r;
          const a = t.$hostElement$,
            c = t.o,
            u = t.B || U(null, null),
            f = ((t) => t && t.j === _)(e) ? e : H(null, null, e);
          if (
            ((B = a.tagName),
            c.P &&
              ((f.v = f.v || {}),
              c.P.forEach(([t, e]) => {
                f.v[e] = a[t];
              })),
            o && f.v)
          )
            for (const t of Object.keys(f.v))
              a.hasAttribute(t) &&
                !['key', 'ref', 'style', 'class'].includes(t) &&
                (f.v[t] = a[t]);
          if (
            ((f.j = null),
            (f.u |= 4),
            (t.B = f),
            (f.O = u.O = a.shadowRoot || a),
            (tt = !(!(1 & c.u) || 128 & c.u)),
            (R = a['s-cr']),
            (et = !1),
            pt(u, f, o),
            (m.u |= 1),
            ot)
          ) {
            ht(f.O);
            for (const t of mt) {
              const e = t.N;
              if (!e['s-ol'] && p.document) {
                const t = p.document.createTextNode('');
                ((t['s-nr'] = e), vt(e.parentNode, (e['s-ol'] = t), e, o));
              }
            }
            for (const t of mt) {
              const e = t.N,
                r = t.C;
              if (
                (1 === e.nodeType &&
                  o &&
                  (e['s-ih'] = null != (n = e.hidden) && n),
                r)
              ) {
                const t = r.parentNode;
                let n = r.nextSibling;
                if (n && 1 === n.nodeType) {
                  let o = null == (i = e['s-ol']) ? void 0 : i.previousSibling;
                  for (; o; ) {
                    let i = null != (l = o['s-nr']) ? l : null;
                    if (
                      i &&
                      i['s-sn'] === e['s-sn'] &&
                      t === (i.__parentNode || i.parentNode)
                    ) {
                      for (
                        i = i.nextSibling;
                        i === e || (null == i ? void 0 : i['s-sr']);
                      )
                        i = null == i ? void 0 : i.nextSibling;
                      if (!i || !i['s-nr']) {
                        n = i;
                        break;
                      }
                    }
                    o = o.previousSibling;
                  }
                }
                if (
                  ((!n && t !== (e.__parentNode || e.parentNode)) ||
                    (e.__nextSibling || e.nextSibling) !== n) &&
                  e !== n
                ) {
                  if (
                    (vt(t, e, n, o),
                    8 === e.nodeType && e.nodeValue.startsWith('s-nt-'))
                  ) {
                    const t = p.document.createTextNode(
                      e.nodeValue.replace(/^s-nt-/, ''),
                    );
                    ((t['s-hn'] = e['s-hn']),
                      (t['s-sn'] = e['s-sn']),
                      (t['s-sh'] = e['s-sh']),
                      (t['s-sr'] = e['s-sr']),
                      (t['s-ol'] = e['s-ol']),
                      (t['s-ol']['s-nr'] = t),
                      vt(e.parentNode, t, e, o),
                      e.parentNode.removeChild(e));
                  }
                  1 === e.nodeType &&
                    'SLOT-FB' !== e.tagName &&
                    (e.hidden = null != (s = e['s-ih']) && s);
                }
                e && 'function' == typeof r['s-rf'] && r['s-rf'](r);
              } else 1 === e.nodeType && (e.hidden = !0);
            }
          }
          if (
            (et && N(f.O),
            (m.u &= -2),
            (mt.length = 0),
            !tt && !(1 & c.u) && a['s-cr'])
          ) {
            const t = f.O.__childNodes || f.O.childNodes;
            for (const e of t)
              if (e['s-hn'] !== B && !e['s-sh'])
                if (
                  (o &&
                    null == e['s-ih'] &&
                    (e['s-ih'] = null != (r = e.hidden) && r),
                  1 === e.nodeType)
                )
                  e.hidden = !0;
                else if (3 === e.nodeType && e.nodeValue.trim()) {
                  const t = p.document.createComment('s-nt-' + e.nodeValue);
                  ((t['s-sn'] = e['s-sn']),
                    vt(e.parentNode, t, e, o),
                    e.parentNode.removeChild(e));
                }
          }
          ((R = void 0),
            it.forEach((t) => t()),
            (it.length = 0),
            lt.forEach((t) => t()),
            (lt.length = 0));
        })(t, e, n));
    } catch (e) {
      a(e, t.$hostElement$);
    }
    return null;
  },
  Ot = (t) => {
    const e = t.$hostElement$,
      o = t.l,
      n = t.F;
    (Nt(o, 'componentDidRender', void 0, e),
      64 & t.u
        ? Nt(o, 'componentDidUpdate', void 0, e)
        : ((t.u |= 64),
          Ct(e),
          Nt(o, 'componentDidLoad', void 0, e),
          t.A(e),
          n || zt()),
      t.D(e),
      t.M && (t.M(), (t.M = void 0)),
      512 & t.u && S(() => wt(t, !1)),
      (t.u &= -517));
  },
  zt = () => {
    S(() => V(p, 'appload', { detail: { namespace: 'lido-player' } }));
  },
  Nt = (t, e, o, n) => {
    if (t && t[e])
      try {
        return t[e](o);
      } catch (t) {
        a(t, n);
      }
  },
  Ct = (t) => t.classList.add('hydrated'),
  Et = (t, e, o, n) => {
    const i = l(t);
    if (!i) return;
    if (!i)
      throw Error(
        `Couldn't find host element for "${n.m}" as it is unknown to this Stencil runtime. This usually happens when integrating a 3rd party Stencil component with another Stencil component or application. Please reach out to the maintainers of the 3rd party Stencil component or report this on the Stencil Discord server (https://chat.stenciljs.com) or comment on this similar [GitHub issue](https://github.com/stenciljs/core/issues/5457).`,
      );
    const s = i.$hostElement$,
      r = i.i.get(e),
      c = i.u,
      u = i.l;
    if (
      ((o = I(o, n.t[e][0])),
      !(
        (8 & c && void 0 !== r) ||
        o === r ||
        (Number.isNaN(r) && Number.isNaN(o))
      ))
    ) {
      if ((i.i.set(e, o), n.H)) {
        const t = n.H[e];
        t &&
          t.map((t) => {
            try {
              const [[n, l]] = Object.entries(t);
              (128 & c || 1 & l) &&
                (u
                  ? u[n](o, r, e)
                  : i.L.push(() => {
                      i.l[n](o, r, e);
                    }));
            } catch (t) {
              a(t, s);
            }
          });
      }
      if (2 & c) {
        if (
          u.componentShouldUpdate &&
          !1 === u.componentShouldUpdate(o, r, e) &&
          !(16 & c)
        )
          return;
        16 & c || wt(i, !1);
      }
    }
  },
  Mt = (t, e, n) => {
    var i, s;
    const r = t.prototype;
    {
      (t.watchers && !e.H && (e.H = t.watchers),
        t.deserializers && !e.U && (e.U = t.deserializers),
        t.serializers && !e._ && (e._ = t.serializers));
      const a = Object.entries(null != (i = e.t) ? i : {});
      if (
        (a.map(([t, [i]]) => {
          if (31 & i || (2 & n && 32 & i)) {
            const { get: s, set: a } = o(r, t) || {};
            (s && (e.t[t][0] |= 2048),
              a && (e.t[t][0] |= 4096),
              (1 & n || !s) &&
                Object.defineProperty(r, t, {
                  get() {
                    {
                      if (!(2048 & e.t[t][0]))
                        return ((t, e) => l(this).i.get(e))(0, t);
                      const o = l(this),
                        n = o ? o.l : r;
                      if (!n) return;
                      return n[t];
                    }
                  },
                  configurable: !0,
                  enumerable: !0,
                }),
              Object.defineProperty(r, t, {
                set(o) {
                  const s = l(this);
                  if (s) {
                    if (a)
                      return (
                        void 0 === (32 & i ? this[t] : s.$hostElement$[t]) &&
                          s.i.get(t) &&
                          (o = s.i.get(t)),
                        a.call(this, I(o, i)),
                        void Et(
                          this,
                          t,
                          (o = 32 & i ? this[t] : s.$hostElement$[t]),
                          e,
                        )
                      );
                    {
                      if (!(1 & n && 4096 & e.t[t][0]))
                        return (
                          Et(this, t, o, e),
                          void (
                            1 & n &&
                            !s.l &&
                            s.L.push(() => {
                              4096 & e.t[t][0] &&
                                s.l[t] !== s.i.get(t) &&
                                (s.l[t] = o);
                            })
                          )
                        );
                      const l = () => {
                        const n = s.l[t];
                        (!s.i.get(t) && n && s.i.set(t, n),
                          (s.l[t] = I(o, i)),
                          Et(this, t, s.l[t], e));
                      };
                      s.l
                        ? l()
                        : s.L.push(() => {
                            l();
                          });
                    }
                  }
                },
              }));
          } else
            1 & n &&
              64 & i &&
              Object.defineProperty(r, t, {
                value(...e) {
                  var o;
                  const n = l(this);
                  return null == (o = null == n ? void 0 : n.I)
                    ? void 0
                    : o.then(() => {
                        var o;
                        return null == (o = n.l) ? void 0 : o[t](...e);
                      });
                },
              });
        }),
        1 & n)
      ) {
        const o = new Map();
        ((r.attributeChangedCallback = function (t, n, i) {
          m.jmp(() => {
            var s;
            const c = o.get(t),
              u = l(this);
            if (
              (this.hasOwnProperty(c) && ((i = this[c]), delete this[c]),
              r.hasOwnProperty(c) && 'number' == typeof this[c] && this[c] == i)
            )
              return;
            if (null == c) {
              const o = null == u ? void 0 : u.u;
              if (u && o && !(8 & o) && i !== n) {
                const l = u.l,
                  r = null == (s = e.H) ? void 0 : s[t];
                null == r ||
                  r.forEach((e) => {
                    const [[s, r]] = Object.entries(e);
                    null != l[s] && (128 & o || 1 & r) && l[s].call(l, i, n, t);
                  });
              }
              return;
            }
            const f = a.find(([t]) => t === c);
            f && 4 & f[1][0] && (i = null !== i && 'false' !== i);
            const d = Object.getOwnPropertyDescriptor(r, c);
            i == this[c] || (d.get && !d.set) || (this[c] = i);
          });
        }),
          (t.observedAttributes = Array.from(
            new Set([
              ...Object.keys(null != (s = e.H) ? s : {}),
              ...a
                .filter(([t, e]) => 31 & e[0])
                .map(([t, n]) => {
                  var i;
                  const l = n[1] || t;
                  return (
                    o.set(l, t),
                    512 & n[0] && (null == (i = e.P) || i.push([t, l])),
                    l
                  );
                }),
            ]),
          )));
      }
    }
    return t;
  },
  Ft = (t, e) => {
    Nt(t, 'connectedCallback', void 0, e);
  },
  Tt = (t, e) => {
    Nt(t, 'disconnectedCallback', void 0, e || t);
  },
  Lt = (t, e = {}) => {
    var o;
    if (!p.document)
      return void console.warn(
        'Stencil: No document found. Skipping bootstrapping lazy components.',
      );
    const n = [],
      i = e.exclude || [],
      s = p.customElements,
      r = p.document.head,
      d = r.querySelector('meta[charset]'),
      h = p.document.createElement('style'),
      g = [];
    let v,
      y = !0;
    (Object.assign(m, e),
      (m.p = new URL(e.resourcesUrl || './', p.document.baseURI).href));
    let w = !1;
    if (
      (t.map((t) => {
        t[1].map((e) => {
          var o, r, f;
          const d = { u: e[0], m: e[1], t: e[2], W: e[3] };
          (4 & d.u && (w = !0),
            (d.t = e[2]),
            (d.P = []),
            (d.H = null != (o = e[4]) ? o : {}),
            (d._ = null != (r = e[5]) ? r : {}),
            (d.U = null != (f = e[6]) ? f : {}));
          const h = d.m,
            x = class extends HTMLElement {
              's-p';
              's-rc';
              hasRegisteredEventListeners = !1;
              constructor(t) {
                if (
                  (super(t),
                  ((t, e) => {
                    const o = {
                      u: 0,
                      $hostElement$: t,
                      o: e,
                      i: new Map(),
                      Y: new Map(),
                    };
                    ((o.I = new Promise((t) => (o.D = t))),
                      (o.V = new Promise((t) => (o.A = t))),
                      (t['s-p'] = []),
                      (t['s-rc'] = []),
                      (o.L = []));
                    const n = o;
                    t.__stencil__getHostRef = () => n;
                  })((t = this), d),
                  1 & d.u)
                )
                  if (t.shadowRoot) {
                    if ('open' !== t.shadowRoot.mode)
                      throw Error(
                        `Unable to re-use existing shadow root for ${d.m}! Mode is set to ${t.shadowRoot.mode} but Stencil only supports open shadow roots.`,
                      );
                  } else z.call(t, d);
              }
              connectedCallback() {
                l(this) &&
                  (this.hasRegisteredEventListeners ||
                    (this.hasRegisteredEventListeners = !0),
                  v && (clearTimeout(v), (v = null)),
                  y
                    ? g.push(this)
                    : m.jmp(() =>
                        ((t) => {
                          if (!(1 & m.u)) {
                            const e = l(t);
                            if (!e) return;
                            const o = e.o,
                              n = () => {};
                            if (1 & e.u)
                              (null == e ? void 0 : e.l)
                                ? Ft(e.l, t)
                                : (null == e ? void 0 : e.V) &&
                                  e.V.then(() => Ft(e.l, t));
                            else {
                              ((e.u |= 1),
                                12 & o.u &&
                                  ((t) => {
                                    if (!p.document) return;
                                    const e = (t['s-cr'] =
                                      p.document.createComment(''));
                                    ((e['s-cn'] = !0), vt(t, e, t.firstChild));
                                  })(t));
                              {
                                let o = t;
                                for (; (o = o.parentNode || o.host); )
                                  if (o['s-p']) {
                                    yt(e, (e.F = o));
                                    break;
                                  }
                              }
                              (o.t &&
                                Object.entries(o.t).map(([e, [o]]) => {
                                  if (
                                    31 & o &&
                                    Object.prototype.hasOwnProperty.call(t, e)
                                  ) {
                                    const o = t[e];
                                    (delete t[e], (t[e] = o));
                                  }
                                }),
                                (async (t, e, o) => {
                                  let n;
                                  try {
                                    if (!(32 & e.u)) {
                                      if (((e.u |= 32), o.q)) {
                                        const i = ((t, e) => {
                                          const o = t.m.replace(/-/g, '_'),
                                            n = t.q;
                                          if (!n) return;
                                          const i = c.get(n);
                                          return i
                                            ? i[o]
                                            : import(`./${n}.entry.js`).then(
                                                (t) => (c.set(n, t), t[o]),
                                                (t) => {
                                                  a(t, e.$hostElement$);
                                                },
                                              );
                                          /*!__STENCIL_STATIC_IMPORT_SWITCH__*/
                                        })(o, e);
                                        if (i && 'then' in i) {
                                          const t = () => {};
                                          ((n = await i), t());
                                        } else n = i;
                                        if (!n)
                                          throw Error(
                                            `Constructor for "${o.m}#${e.G}" was not found`,
                                          );
                                        n.isProxied ||
                                          ((o.H = n.watchers),
                                          (o._ = n.serializers),
                                          (o.U = n.deserializers),
                                          Mt(n, o, 2),
                                          (n.isProxied = !0));
                                        const l = () => {};
                                        e.u |= 8;
                                        try {
                                          new n(e);
                                        } catch (e) {
                                          a(e, t);
                                        }
                                        ((e.u &= -9),
                                          (e.u |= 128),
                                          l(),
                                          4 & o.u ? (e.T = !0) : Ft(e.l, t));
                                      } else
                                        ((n = t.constructor),
                                          customElements
                                            .whenDefined(t.localName)
                                            .then(() => (e.u |= 128)));
                                      if (n && n.style) {
                                        let t;
                                        'string' == typeof n.style &&
                                          (t = n.style);
                                        const e = A(o);
                                        if (!u.has(e)) {
                                          const n = () => {};
                                          (((t, e, o) => {
                                            let n = u.get(t);
                                            (b && o
                                              ? ((n = n || new CSSStyleSheet()),
                                                'string' == typeof n
                                                  ? (n = e)
                                                  : n.replaceSync(e))
                                              : (n = e),
                                              u.set(t, n));
                                          })(e, t, !!(1 & o.u)),
                                            n());
                                        }
                                      }
                                    }
                                    const i = e.F,
                                      l = () => wt(e, !0);
                                    i && i['s-rc'] ? i['s-rc'].push(l) : l();
                                  } catch (o) {
                                    (a(o, t),
                                      e.M && (e.M(), (e.M = void 0)),
                                      e.A && e.A(t));
                                  }
                                })(t, e, o));
                            }
                            n();
                          }
                        })(this),
                      ));
              }
              disconnectedCallback() {
                (m.jmp(() =>
                  (async (t) => {
                    if (!(1 & m.u)) {
                      const e = l(t);
                      (null == e ? void 0 : e.l)
                        ? Tt(e.l, t)
                        : (null == e ? void 0 : e.V) &&
                          e.V.then(() => Tt(e.l, t));
                    }
                    (P.has(t) && P.delete(t),
                      t.shadowRoot &&
                        P.has(t.shadowRoot) &&
                        P.delete(t.shadowRoot));
                  })(this),
                ),
                  m.raf(() => {
                    var t;
                    const e = l(this);
                    if (!e) return;
                    const o = g.findIndex((t) => t === this);
                    (o > -1 && g.splice(o, 1),
                      (null == (t = null == e ? void 0 : e.B)
                        ? void 0
                        : t.O) instanceof Node &&
                        !e.B.O.isConnected &&
                        delete e.B.O);
                  }));
              }
              componentOnReady() {
                var t;
                return null == (t = l(this)) ? void 0 : t.V;
              }
            };
          ((d.q = t[0]),
            i.includes(h) || s.get(h) || (n.push(h), s.define(h, Mt(x, d, 1))));
        });
      }),
      n.length > 0 &&
        (w && (h.textContent += f),
        (h.textContent +=
          n.sort() + '{visibility:hidden}.hydrated{visibility:inherit}'),
        h.innerHTML.length))
    ) {
      h.setAttribute('data-styles', '');
      const t = null != (o = m.R) ? o : L(p.document);
      (null != t && h.setAttribute('nonce', t),
        r.insertBefore(h, d ? d.nextSibling : r.firstChild));
    }
    ((y = !1),
      g.length
        ? g.map((t) => t.connectedCallback())
        : m.jmp(() => (v = setTimeout(zt, 30))));
  },
  Rt = (t) => (m.R = t);
export {
  _ as H,
  W as a,
  Lt as b,
  Y as c,
  O as d,
  t as g,
  H as h,
  h as p,
  s as r,
  Rt as s,
};
