/**
 * Image Compare — a native DSH client plugin.
 *
 * Registers one global page in the left sidebar (`sidebar.panellist` + `main`)
 * that overlays two images and reveals them with a pointer-following split.
 * The split line is eased with requestAnimationFrame and painted directly on
 * the DOM, so hover/drag stays smooth without a React render per frame.
 */
window.__ModuleLoader__.load({
  id: 'dsh-image-compare',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const PANEL_ID = 'image-compare'
    const STYLE_ID = 'dsh-image-compare-style'

    const CSS = String.raw`
.ic-page {
  --ic-bg: var(--dsw-alias-bg-base, #ffffff);
  --ic-card: var(--dsw-alias-bg-layer-2, #f6f7f9);
  --ic-ink: var(--dsw-alias-label-primary, #1f2328);
  --ic-ink2: var(--dsw-alias-label-secondary, #5c6470);
  --ic-ink3: var(--dsw-alias-label-tertiary, #8a919e);
  --ic-line: var(--dsw-alias-border-l2, rgba(0, 0, 0, .09));
  --ic-line-strong: var(--dsw-alias-border-l4, rgba(0, 0, 0, .18));
  --ic-hover: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, .045));
  --ic-active: var(--dsw-alias-interactive-bg-active, rgba(0, 0, 0, .07));
  --ic-link: var(--dsw-alias-link, #2563eb);
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  padding: 22px 26px 16px;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--ic-bg);
  color: var(--ic-ink);
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
}
.ic-page *, .ic-page *::before, .ic-page *::after { box-sizing: border-box; }

.ic-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; flex-wrap: wrap; padding-bottom: 16px; width: 100%; min-width: 0; }
.ic-heading { min-width: 0; }
.ic-eyebrow { display: flex; align-items: center; gap: 7px; font-size: 10.5px; font-weight: 650; letter-spacing: .12em; color: var(--ic-ink3); text-transform: uppercase; }
.ic-eyebrow::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--ic-link); box-shadow: 0 0 0 4px color-mix(in srgb, var(--ic-link) 14%, transparent); }
.ic-title { margin: 9px 0 0; font-size: 21px; line-height: 1.2; font-weight: 680; letter-spacing: -.02em; color: var(--ic-ink); }
.ic-sub { margin: 7px 0 0; max-width: 560px; font-size: 12.5px; line-height: 1.6; color: var(--ic-ink2); }

.ic-toolbar { display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-wrap: wrap; padding-top: 2px; }
.ic-toolbar-row { justify-content: flex-start; width: 100%; min-width: 0; padding: 0 0 14px; }
.ic-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 32px; padding: 0 11px; border: 1px solid var(--ic-line); border-radius: 9px;
  background: var(--ic-card); color: var(--ic-ink); font: inherit; font-size: 12.5px; font-weight: 520;
  cursor: pointer; white-space: nowrap;
  transition: background .16s ease, border-color .16s ease, transform .16s ease, opacity .16s ease;
}
.ic-btn:hover:not(:disabled) { background: var(--ic-hover); border-color: var(--ic-line-strong); }
.ic-btn:active:not(:disabled) { transform: scale(.975); }
.ic-btn:disabled { opacity: .42; cursor: default; }
.ic-btn:focus-visible { outline: 2px solid color-mix(in srgb, var(--ic-link) 70%, transparent); outline-offset: 2px; }
.ic-btn svg { flex: none; }
.ic-btn.is-icon { width: 32px; padding: 0; }
.ic-btn[aria-pressed="true"] { background: color-mix(in srgb, var(--ic-link) 12%, var(--ic-card)); border-color: color-mix(in srgb, var(--ic-link) 42%, var(--ic-line)); color: var(--ic-link); }
.ic-btn[aria-pressed="true"]:hover:not(:disabled) { background: color-mix(in srgb, var(--ic-link) 17%, var(--ic-card)); border-color: color-mix(in srgb, var(--ic-link) 55%, var(--ic-line)); }

.ic-seg { display: inline-flex; padding: 2px; gap: 2px; border-radius: 10px; background: var(--ic-card); border: 1px solid var(--ic-line); }
.ic-seg button {
  height: 26px; padding: 0 9px; border: 0; border-radius: 7px; background: transparent; color: var(--ic-ink3);
  font: inherit; font-size: 12px; font-weight: 520; cursor: pointer; transition: background .16s ease, color .16s ease;
}
.ic-seg button:hover { color: var(--ic-ink); }
.ic-seg button[data-active] { background: var(--ic-bg); color: var(--ic-ink); box-shadow: 0 1px 2px rgba(0,0,0,.1), 0 0 0 1px var(--ic-line); }
.ic-seg button:focus-visible { outline: 2px solid color-mix(in srgb, var(--ic-link) 70%, transparent); outline-offset: 1px; }

.ic-stage-wrap { position: relative; flex: 1; min-height: 0; display: flex; padding: 2px 0 12px; }
.ic-stage {
  position: relative; flex: 1; min-height: 300px; overflow: hidden; border-radius: 16px;
  border: 1px solid var(--ic-line); background-color: #0c0e12;
  background-image: linear-gradient(45deg, rgba(255,255,255,.022) 25%, transparent 25%, transparent 75%, rgba(255,255,255,.022) 75%), linear-gradient(45deg, rgba(255,255,255,.022) 25%, transparent 25%, transparent 75%, rgba(255,255,255,.022) 75%);
  background-size: 28px 28px; background-position: 0 0, 14px 14px;
  cursor: ew-resize; touch-action: none; user-select: none; -webkit-user-select: none;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.035), 0 22px 48px -34px rgba(0,0,0,.6);
  outline: none;
}
.ic-stage:focus-visible { box-shadow: inset 0 0 0 1px rgba(255,255,255,.04), 0 0 0 2px color-mix(in srgb, var(--ic-link) 65%, transparent); }
.ic-stage[data-dragging] { cursor: grabbing; }
.ic-img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: contain; pointer-events: none; user-select: none; -webkit-user-drag: none; animation: ic-fade .32s ease both; }
.ic-top { position: absolute; inset: 0; will-change: clip-path; }
.ic-top .ic-img { animation: none; }

.ic-chip {
  position: absolute; top: 14px; z-index: 3; display: inline-flex; align-items: center; gap: 8px;
  max-width: 42%; padding: 4px 11px 4px 5px; border-radius: 999px;
  border: 1px solid rgba(255,255,255,.15); background: rgba(9,11,16,.62);
  -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
  color: #f4f6fa; font-size: 11.5px; line-height: 1; pointer-events: none;
  box-shadow: 0 4px 18px rgba(0,0,0,.24);
}
.ic-chip-a { left: 14px; }
.ic-chip-b { right: 14px; }
.ic-chip b { display: inline-flex; align-items: center; justify-content: center; width: 19px; height: 19px; border-radius: 50%; background: #fff; color: #11141a; font-size: 10px; font-weight: 720; }
.ic-chip-b b { background: #dbeafe; }
.ic-chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: .88; }

.ic-divider { position: absolute; top: 0; bottom: 0; z-index: 4; width: 2px; margin-left: -1px; pointer-events: none; background: linear-gradient(to bottom, rgba(255,255,255,0), #fff 12%, #fff 88%, rgba(255,255,255,0)); box-shadow: 0 0 18px rgba(0,0,0,.5); }
.ic-knob {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%;
  background: rgba(255,255,255,.97); color: #12151b;
  font-size: 11px; font-weight: 700; letter-spacing: -.01em;
  box-shadow: 0 2px 5px rgba(0,0,0,.16), 0 10px 28px -8px rgba(0,0,0,.5), 0 0 0 1px rgba(0,0,0,.05);
  transition: transform .18s cubic-bezier(.2,.8,.2,1), box-shadow .18s ease, width .18s ease, height .18s ease;
}
.ic-knob.is-compact { width: 34px; height: 34px; }
.ic-knob.is-compact::before { left: -11px; }
.ic-knob.is-compact::after { right: -11px; }
.ic-pct { font-variant-numeric: tabular-nums; }
.ic-stage:hover .ic-knob { transform: translate(-50%, -50%) scale(1.07); box-shadow: 0 3px 7px rgba(0,0,0,.18), 0 14px 34px -8px rgba(0,0,0,.55), 0 0 0 1px rgba(0,0,0,.05); }
.ic-stage:active .ic-knob { transform: translate(-50%, -50%) scale(.98); }
.ic-knob::before, .ic-knob::after { content: ""; position: absolute; top: 50%; width: 7px; height: 7px; border-top: 1.6px solid #12151b; border-left: 1.6px solid #12151b; opacity: .5; }
.ic-knob::before { left: -13px; transform: translateY(-50%) rotate(-45deg); }
.ic-knob::after { right: -13px; transform: translateY(-50%) rotate(135deg); }

.ic-foot { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding-top: 11px; border-top: 1px solid var(--ic-line); font-size: 11.5px; color: var(--ic-ink3); }
.ic-files { display: flex; align-items: center; gap: 9px; min-width: 0; }
.ic-filetag { display: inline-flex; align-items: center; gap: 6px; min-width: 0; max-width: 280px; }
.ic-filetag b { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 17px; height: 17px; border-radius: 5px; background: var(--ic-card); border: 1px solid var(--ic-line); color: var(--ic-ink2); font-size: 9.5px; font-weight: 700; }
.ic-filetag span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ic-tips { display: flex; align-items: center; gap: 5px; flex: none; }
.ic-tips kbd { display: inline-flex; align-items: center; justify-content: center; min-width: 19px; height: 19px; padding: 0 4px; border-radius: 5px; border: 1px solid var(--ic-line); border-bottom-width: 2px; background: var(--ic-card); color: var(--ic-ink2); font: inherit; font-size: 10px; }
.ic-tips .ic-sep { opacity: .45; padding: 0 2px; }

.ic-empty { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 26px; padding: 12px 0 22px; }
.ic-empty-intro { text-align: center; }
.ic-empty-intro h2 { margin: 0; font-size: 18px; line-height: 1.3; font-weight: 650; letter-spacing: -.015em; color: var(--ic-ink); }
.ic-empty-intro p { margin: 7px 0 0; font-size: 12.5px; line-height: 1.6; color: var(--ic-ink3); }
.ic-slots { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 18px; width: min(880px, 100%); }
.ic-slot {
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 9px;
  aspect-ratio: 16 / 10; overflow: hidden; border-radius: 16px;
  border: 1.5px dashed var(--ic-line-strong); background: var(--ic-card); color: var(--ic-ink2);
  cursor: pointer; transition: border-color .18s ease, background .18s ease, box-shadow .18s ease, transform .18s ease;
}
.ic-slot:hover { border-color: color-mix(in srgb, var(--ic-link) 55%, var(--ic-line-strong)); background: var(--ic-hover); }
.ic-slot:focus-visible { outline: 2px solid color-mix(in srgb, var(--ic-link) 70%, transparent); outline-offset: 3px; }
.ic-slot.is-over { border-color: var(--ic-link); border-style: solid; background: color-mix(in srgb, var(--ic-link) 7%, var(--ic-card)); box-shadow: 0 0 0 5px color-mix(in srgb, var(--ic-link) 13%, transparent); }
.ic-slot.is-filled { border-style: solid; border-color: var(--ic-line); background: #0c0e12; }
.ic-slot.is-filled:hover { border-color: var(--ic-line-strong); }
.ic-slot.is-filled img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
.ic-slot-upload { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 18px; text-align: center; }
.ic-slot-upload .ic-slot-icon { display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 13px; background: var(--ic-bg); border: 1px solid var(--ic-line); color: var(--ic-ink2); box-shadow: 0 6px 16px -10px rgba(0,0,0,.3); }
.ic-slot-upload strong { font-size: 13px; font-weight: 600; color: var(--ic-ink); }
.ic-slot-upload small { font-size: 11.5px; color: var(--ic-ink3); }
.ic-slot-badge { position: absolute; top: 12px; left: 12px; z-index: 2; display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 7px; background: rgba(9,11,16,.66); border: 1px solid rgba(255,255,255,.18); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); color: #fff; font-size: 10.5px; font-weight: 700; }
.ic-slot-caption { position: absolute; left: 0; right: 0; bottom: 0; z-index: 2; display: flex; flex-direction: column; gap: 2px; padding: 26px 14px 12px; background: linear-gradient(to top, rgba(7,9,13,.82), rgba(7,9,13,0)); color: #fff; pointer-events: none; }
.ic-slot-caption strong { font-size: 12px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ic-slot-caption small { font-size: 10.5px; opacity: .62; }
.ic-slot-remove { position: absolute; top: 10px; right: 10px; z-index: 3; display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 8px; border: 1px solid rgba(255,255,255,.18); background: rgba(9,11,16,.66); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); color: #fff; cursor: pointer; transition: background .15s ease, transform .15s ease; }
.ic-slot-remove:hover { background: rgba(190,50,50,.82); }
.ic-slot-remove:active { transform: scale(.94); }
.ic-file { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }

@keyframes ic-fade { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .ic-img, .ic-knob, .ic-slot, .ic-btn { animation: none !important; transition: none !important; }
}
@media (max-width: 760px) {
  .ic-page { padding: 16px 16px 12px; }
  .ic-toolbar { justify-content: flex-start; }
  .ic-foot { align-items: flex-start; flex-direction: column; gap: 8px; }
}
`

    function IconImage({ size = 18 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
      },
      h('rect', { x: 3, y: 4, width: 18, height: 16, rx: 3 }),
      h('circle', { cx: 8.5, cy: 9.5, r: 1.4 }),
      h('path', { d: 'm4 17 5-5 4 4 3-3 4 4' }))
    }

    function IconUpload({ size = 18 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
      },
      h('path', { d: 'M12 16V4m0 0L8 8m4-4 4 4' }),
      h('path', { d: 'M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3' }))
    }

    function IconSwap({ size = 16 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
      },
      h('path', { d: 'M4 8h14m0 0-3-3m3 3-3 3' }),
      h('path', { d: 'M20 16H6m0 0 3-3m-3 3 3 3' }))
    }

    function IconReset({ size = 16 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
      },
      h('path', { d: 'M4 5v5h5' }),
      h('path', { d: 'M4.6 13a8 8 0 1 0 2-7.4L4 10' }))
    }

    function IconPercent({ size = 16 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
      },
      h('path', { d: 'M19 5 5 19' }),
      h('circle', { cx: 7.5, cy: 7.5, r: 2.2 }),
      h('circle', { cx: 16.5, cy: 16.5, r: 2.2 }))
    }

    function IconX({ size = 14 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', 'aria-hidden': true,
      },
      h('path', { d: 'M6 6l12 12M18 6 6 18' }))
    }

    function SidebarIcon({ size = 18 }) {
      const s = typeof size === 'number' && size > 0 ? size : 18
      return h('svg', {
        width: s, height: s, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
      },
      h('rect', { x: 3.5, y: 5, width: 10, height: 14, rx: 2 }),
      h('rect', { x: 10.5, y: 5, width: 10, height: 14, rx: 2, opacity: 0.55 }),
      h('path', { d: 'M12 3v18' }),
      h('circle', { cx: 12, cy: 12, r: 3, fill: 'currentColor', stroke: 'none' }),
      h('path', { d: 'm10.6 10.6-.9 1.4 1.1 1.2m2.6-2.6.9 1.4-1.1 1.2', strokeWidth: 1.2 }))
    }

    function formatBytes(bytes) {
      if (!bytes || bytes < 1024) return bytes ? bytes + ' B' : ''
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(bytes < 10240 ? 1 : 0) + ' KB'
      return (bytes / 1024 / 1024).toFixed(1) + ' MB'
    }

    function ToolButton({ children, onClick, title, disabled, icon, className, pressed }) {
      return h('button', {
        type: 'button',
        className: 'ic-btn' + (icon && !children ? ' is-icon' : '') + (className ? ' ' + className : ''),
        onClick,
        title,
        disabled: disabled || undefined,
        'aria-label': title,
        'aria-pressed': pressed === undefined ? undefined : String(pressed),
      }, icon || null, children || null)
    }

    function DropSlot({ side, image, onPick, onFile, onClear }) {
      const [over, setOver] = React.useState(false)
      const drop = (event) => {
        event.preventDefault()
        event.stopPropagation()
        setOver(false)
        const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]
        if (file) onFile(file)
      }
      const keydown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onPick()
        }
      }
      if (image) {
        return h('div', {
          className: 'ic-slot is-filled',
          role: 'button',
          tabIndex: 0,
          title: '点击更换图片',
          onClick: onPick,
          onKeyDown: keydown,
        },
        h('img', { src: image.url, alt: '图 ' + side, draggable: false }),
        h('span', { className: 'ic-slot-badge' }, side),
        h('div', { className: 'ic-slot-caption' },
          h('strong', null, image.name),
          h('small', null, formatBytes(image.size))),
        h('button', {
          type: 'button',
          className: 'ic-slot-remove',
          title: '移除图片',
          'aria-label': '移除图片 ' + side,
          onClick: (event) => { event.stopPropagation(); onClear() },
        }, h(IconX, null)))
      }
      return h('div', {
        className: 'ic-slot' + (over ? ' is-over' : ''),
        role: 'button',
        tabIndex: 0,
        onClick: onPick,
        onKeyDown: keydown,
        onDragOver: (event) => { event.preventDefault(); setOver(true) },
        onDragLeave: () => setOver(false),
        onDrop: drop,
      },
      h('div', { className: 'ic-slot-upload' },
        h('span', { className: 'ic-slot-icon' }, h(IconImage, { size: 20 })),
        h('strong', null, '添加图 ' + side),
        h('small', null, '点击选择，或把图片拖进来')))
    }

    function CompareStage({ left, right, fit, resetNonce, showPercent }) {
      const stageRef = React.useRef(null)
      const topRef = React.useRef(null)
      const lineRef = React.useRef(null)
      const pctRef = React.useRef(null)
      const targetRef = React.useRef(0.5)
      const valueRef = React.useRef(0.5)
      const [dragging, setDragging] = React.useState(false)

      React.useEffect(() => {
        if (!resetNonce) return
        targetRef.current = 0.5
      }, [resetNonce])

      React.useEffect(() => {
        if (pctRef.current) pctRef.current.textContent = Math.round(valueRef.current * 100) + '%'
      }, [showPercent])

      React.useEffect(() => {
        let frame = 0
        let current = 0.5
        let painted = -1
        const paint = (value) => {
          const pct = value * 100
          valueRef.current = value
          if (topRef.current) topRef.current.style.clipPath = 'inset(0 0 0 ' + pct.toFixed(3) + '%)'
          if (lineRef.current) lineRef.current.style.left = pct.toFixed(3) + '%'
          if (pctRef.current) pctRef.current.textContent = Math.round(pct) + '%'
          if (stageRef.current) stageRef.current.setAttribute('aria-valuenow', String(Math.round(pct)))
        }
        paint(0.5)
        painted = 0.5
        const tick = () => {
          const target = targetRef.current
          const delta = target - current
          if (Math.abs(delta) > 0.0004) current += delta * 0.18
          else current = target
          if (Math.abs(current - painted) > 0.00015) {
            paint(current)
            painted = current
          }
          frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
      }, [])

      const setFromClientX = (clientX) => {
        const stage = stageRef.current
        if (!stage) return
        const rect = stage.getBoundingClientRect()
        if (rect.width <= 0) return
        targetRef.current = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      }

      const onPointerDown = (event) => {
        if (event.button !== 0 && event.pointerType === 'mouse') return
        setDragging(true)
        try { event.currentTarget.setPointerCapture(event.pointerId) } catch {}
        setFromClientX(event.clientX)
        event.currentTarget.focus({ preventScroll: true })
      }
      const onPointerMove = (event) => {
        if (event.pointerType !== 'mouse' && event.buttons === 0) return
        setFromClientX(event.clientX)
      }
      const endDrag = (event) => {
        setDragging(false)
        try {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
        } catch {}
      }
      const onKeyDown = (event) => {
        const step = event.shiftKey ? 0.1 : 0.02
        let next = targetRef.current
        if (event.key === 'ArrowLeft') next -= step
        else if (event.key === 'ArrowRight') next += step
        else if (event.key === 'Home') next = 0
        else if (event.key === 'End') next = 1
        else return
        event.preventDefault()
        targetRef.current = Math.max(0, Math.min(1, next))
      }

      return h('div', { className: 'ic-stage-wrap' },
        h('div', {
          ref: stageRef,
          className: 'ic-stage',
          role: 'slider',
          tabIndex: 0,
          'aria-label': '图片对比分割线',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': 50,
          'data-dragging': dragging ? '' : undefined,
          onPointerDown,
          onPointerMove,
          onPointerUp: endDrag,
          onPointerCancel: endDrag,
          onLostPointerCapture: () => setDragging(false),
          onKeyDown,
          onDoubleClick: () => { targetRef.current = 0.5 },
        },
        h('img', {
          key: left.url,
          className: 'ic-img',
          src: left.url,
          alt: '图 A：' + left.name,
          draggable: false,
          style: { objectFit: fit },
        }),
        h('div', { ref: topRef, className: 'ic-top' },
          h('img', {
            className: 'ic-img',
            src: right.url,
            alt: '图 B：' + right.name,
            draggable: false,
            style: { objectFit: fit },
          })),
        h('div', { className: 'ic-chip ic-chip-a' }, h('b', null, 'A'), h('span', null, left.name)),
        h('div', { className: 'ic-chip ic-chip-b' }, h('b', null, 'B'), h('span', null, right.name)),
        h('div', { ref: lineRef, className: 'ic-divider' },
          h('div', { className: 'ic-knob' + (showPercent ? '' : ' is-compact') },
            showPercent ? h('span', { ref: pctRef, className: 'ic-pct' }, '50%') : null))))
    }

    function ComparePage() {
      const [left, setLeft] = React.useState(null)
      const [right, setRight] = React.useState(null)
      const [fit, setFit] = React.useState('contain')
      const [showPercent, setShowPercent] = React.useState(() => {
        try { return localStorage.getItem('dsh-image-compare:show-percent') === '1' } catch { return false }
      })
      const [resetNonce, setResetNonce] = React.useState(0)

      React.useEffect(() => {
        try { localStorage.setItem('dsh-image-compare:show-percent', showPercent ? '1' : '0') } catch {}
      }, [showPercent])
      const leftRef = React.useRef(null)
      const rightRef = React.useRef(null)
      const urlsRef = React.useRef(new Set())
      const leftInput = React.useRef(null)
      const rightInput = React.useRef(null)

      React.useEffect(() => () => {
        for (const url of urlsRef.current) {
          try { URL.revokeObjectURL(url) } catch {}
        }
        urlsRef.current.clear()
      }, [])

      const applyImage = React.useCallback((side, item) => {
        if (side === 'A') {
          leftRef.current = item
          setLeft(item)
        } else {
          rightRef.current = item
          setRight(item)
        }
        setResetNonce((value) => value + 1)
      }, [])

      const loadFile = React.useCallback((side, file) => {
        if (!file || typeof file.type !== 'string' || !file.type.startsWith('image/')) return
        const url = URL.createObjectURL(file)
        urlsRef.current.add(url)
        applyImage(side, { url, name: file.name || ('图片 ' + side), size: file.size || 0 })
      }, [applyImage])

      const pick = (side) => {
        const input = side === 'A' ? leftInput.current : rightInput.current
        if (input) input.click()
      }

      const clear = (side) => {
        if (side === 'A') {
          leftRef.current = null
          setLeft(null)
        } else {
          rightRef.current = null
          setRight(null)
        }
      }

      const swap = () => {
        if (!leftRef.current || !rightRef.current) return
        const nextLeft = rightRef.current
        const nextRight = leftRef.current
        leftRef.current = nextLeft
        rightRef.current = nextRight
        setLeft(nextLeft)
        setRight(nextRight)
        setResetNonce((value) => value + 1)
      }

      React.useEffect(() => {
        const onPaste = (event) => {
          const target = event.target
          if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
          const items = event.clipboardData && event.clipboardData.items
          if (!items) return
          for (const item of items) {
            if (item.kind !== 'file' || !item.type.startsWith('image/')) continue
            const file = item.getAsFile()
            if (!file) continue
            event.preventDefault()
            loadFile(leftRef.current ? 'B' : 'A', file)
            return
          }
        }
        window.addEventListener('paste', onPaste)
        return () => window.removeEventListener('paste', onPaste)
      }, [loadFile])

      const both = Boolean(left && right)
      const fileInput = (side, ref) => h('input', {
        ref,
        type: 'file',
        accept: 'image/*',
        className: 'ic-file',
        tabIndex: -1,
        'aria-hidden': 'true',
        onChange: (event) => {
          const file = event.target.files && event.target.files[0]
          if (file) loadFile(side, file)
          event.target.value = ''
        },
      })

      return h('div', { className: 'ic-page' },
        h('header', { className: 'ic-header' },
          h('div', { className: 'ic-heading' },
            h('div', { className: 'ic-eyebrow' }, 'IMAGE COMPARE'),
            h('h1', { className: 'ic-title' }, '图片对比'),
            h('p', { className: 'ic-sub' }, '把两张图叠在一起，鼠标在画面上左右移动，即可丝滑地揭示差异。也可以直接拖拽分割线。'))),
        h('div', { className: 'ic-toolbar ic-toolbar-row' },
            h(ToolButton, {
              onClick: () => pick('A'),
              title: '选择左图（A）',
              icon: h(IconUpload, { size: 15 }),
            }, '左图'),
            h(ToolButton, {
              onClick: () => pick('B'),
              title: '选择右图（B）',
              icon: h(IconUpload, { size: 15 }),
            }, '右图'),
            h(ToolButton, {
              onClick: swap,
              disabled: !both,
              title: '交换左右图片',
              icon: h(IconSwap, null),
            }, '交换'),
            h('div', { className: 'ic-seg', role: 'group', 'aria-label': '图片显示方式' },
              h('button', {
                type: 'button',
                'data-active': fit === 'contain' ? '' : undefined,
                onClick: () => setFit('contain'),
                title: '完整显示整张图片',
              }, '适配'),
              h('button', {
                type: 'button',
                'data-active': fit === 'cover' ? '' : undefined,
                onClick: () => setFit('cover'),
                title: '填满画布（可能裁切边缘）',
              }, '填充')),
            h(ToolButton, {
              onClick: () => setShowPercent((value) => !value),
              title: showPercent ? '隐藏分割线百分比' : '显示分割线百分比',
              icon: h(IconPercent, null),
              pressed: showPercent,
            }, '百分比'),
            h(ToolButton, {
              onClick: () => setResetNonce((value) => value + 1),
              disabled: !both,
              title: '把分割线复位到中间',
              icon: h(IconReset, null),
            })),
        both
          ? h(CompareStage, { left, right, fit, resetNonce, showPercent })
          : h('div', { className: 'ic-empty' },
            h('div', { className: 'ic-empty-intro' },
              h('h2', null, both ? '' : '选择两张图片，开始对比'),
              h('p', null, '点击下方卡片、拖入文件，或直接按 Ctrl / ⌘ + V 粘贴剪贴板里的图片。')),
            h('div', { className: 'ic-slots' },
              h(DropSlot, {
                side: 'A',
                image: left,
                onPick: () => pick('A'),
                onFile: (file) => loadFile('A', file),
                onClear: () => clear('A'),
              }),
              h(DropSlot, {
                side: 'B',
                image: right,
                onPick: () => pick('B'),
                onFile: (file) => loadFile('B', file),
                onClear: () => clear('B'),
              }))),
        h('footer', { className: 'ic-foot' },
          h('div', { className: 'ic-files' },
            h('span', { className: 'ic-filetag' },
              h('b', null, 'A'),
              h('span', null, left ? left.name : '尚未选择左图')),
            h('span', { className: 'ic-sep', 'aria-hidden': true }, '·'),
            h('span', { className: 'ic-filetag' },
              h('b', null, 'B'),
              h('span', null, right ? right.name : '尚未选择右图'))),
          h('div', { className: 'ic-tips' },
            h('kbd', null, '←'),
            h('kbd', null, '→'),
            h('span', null, '微调'),
            h('span', { className: 'ic-sep' }, '·'),
            h('span', null, '鼠标左右移动对比'),
            h('span', { className: 'ic-sep' }, '·'),
            h('span', null, '双击复位'))),
        fileInput('A', leftInput),
        fileInput('B', rightInput))
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.effect(() => {
          if (typeof document === 'undefined') return
          const existing = document.getElementById(STYLE_ID)
          const style = existing || document.createElement('style')
          style.id = STYLE_ID
          style.textContent = CSS
          if (!existing) document.head.appendChild(style)
          return () => {
            if (!existing) style.remove()
          }
        }, 'image-compare: styles')

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 4,
          label: '图片对比',
        }, SidebarIcon))

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
        }, ComparePage))
      },
    }
  },
})
