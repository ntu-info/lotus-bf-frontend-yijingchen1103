import { useCallback, useRef, useState } from 'react'
import { Terms } from './components/Terms'
import { QueryBuilder } from './components/QueryBuilder'
import { Studies } from './components/Studies'
import { NiiViewer } from './components/NiiViewer'
import { useUrlQueryState } from './hooks/useUrlQueryState'
import './App.css'

export default function App () {
  const [query, setQuery] = useUrlQueryState('q')

  const handlePickTerm = useCallback((t) => {
    setQuery((q) => (q ? `${q} ${t}` : t))
  }, [setQuery])

  // --- resizable panes state ---
  const gridRef = useRef(null)
  const [sizes, setSizes] = useState([28, 44, 28]) // [left, middle, right]
  const MIN_PX = 240

  const startDrag = (which, e) => {
    e.preventDefault()
    const startX = e.clientX
    const rect = gridRef.current.getBoundingClientRect()
    const total = rect.width
    const curPx = sizes.map(p => (p / 100) * total)

    const onMouseMove = (ev) => {
      const dx = ev.clientX - startX
      if (which === 0) {
        let newLeft = curPx[0] + dx
        let newMid = curPx[1] - dx
        if (newLeft < MIN_PX) { newMid -= (MIN_PX - newLeft); newLeft = MIN_PX }
        if (newMid < MIN_PX) { newLeft -= (MIN_PX - newMid); newMid = MIN_PX }
        const s0 = (newLeft / total) * 100
        const s1 = (newMid / total) * 100
        const s2 = 100 - s0 - s1
        setSizes([s0, s1, Math.max(s2, 0)])
      } else {
        let newMid = curPx[1] + dx
        let newRight = curPx[2] - dx
        if (newMid < MIN_PX) { newRight -= (MIN_PX - newMid); newMid = MIN_PX }
        if (newRight < MIN_PX) { newMid -= (MIN_PX - newRight); newRight = MIN_PX }
        const s1 = (newMid / total) * 100
        const s2 = (newRight / total) * 100
        const s0 = (curPx[0] / total) * 100
        setSizes([s0, s1, Math.max(s2, 0)])
      }
    }
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div className="app">
      {/* 全域樣式：漸層背景 + 彩色卡片 + 按鈕 */}
            <style>{`
        :root {
          --primary-600: #6366f1;  /* indigo */
          --primary-700: #4f46e5;
          --primary-800: #4338ca;
          --border: #e5e7eb;
          --teal:   #0d9488;
          --purple: #7c3aed;
          --rose:   #e11d48;
        }

        /* 把整個頁面高度拉滿，背景統一成漸層，蓋掉舊的黑色背景 */
        html, body, #root {
          margin: 0;
          padding: 0;
          height: 100%;
        }

        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
          background: radial-gradient(circle at top left, #eef2ff, #ecfeff);
        }

        .app {
          padding: 16px 24px 24px;
          box-sizing: border-box;
          max-width: 100vw;
          overflow-x: hidden;
          min-height: 100vh;        /* 讓 app 填滿整個視窗高度 */
        }

        /* 確保中間的 main/網格不再有黑色底色 */
        .app__grid {
          display: flex;
          gap: 12px;
          width: 100%;
          max-width: 1220px;
          margin: 10px auto 0 auto;
          background: transparent;
        }

        .app__header {
          max-width: 1220px;
          margin: 0 auto 10px auto;
        }

        .app__title {
          font-size: 1.7rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          margin-bottom: 4px;
          background: linear-gradient(90deg, #0ea5e9, #6366f1, #f97316);
          -webkit-background-clip: text;
          color: transparent;
        }

        .app__subtitle {
          font-size: 0.95rem;
          color: #4b5563;
        }

        .app__intro {
          margin-top: 8px;
          padding: 8px 12px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(209, 213, 219, 0.8);
          font-size: 0.85rem;
          color: #374151;
        }
        .app__intro ol {
          margin: 4px 0 0 18px;
        }

        /* 底下保留你原本的 card / resizer / button 樣式即可 ... */
        .card {
          min-width: 0;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          border: 1px solid rgba(209, 213, 219, 0.9);
          padding: 8px 10px 10px;
          display: flex;
          flex-direction: column;
        }

        .card__title {
          font-weight: 700;
          font-size: 0.95rem;
          margin-bottom: 6px;
        }

        .card--left { border-top: 4px solid var(--teal); }
        .card--middle { border-top: 4px solid var(--purple); }
        .card--right { border-top: 4px solid var(--rose); }

        .resizer {
          width: 6px;
          cursor: col-resize;
          background: transparent;
        }
        .resizer:hover {
          background: linear-gradient(to bottom, #38bdf8, #a855f7);
          opacity: 0.5;
          border-radius: 999px;
        }

        .card input[type="text"],
        .card input[type="search"],
        .card input[type="number"],
        .card select,
        .card textarea {
          width: 100% !important;
          max-width: 100% !important;
          display: block;
        }

        .card button,
        .card [role="button"],
        .card .btn,
        .card .button {
          font-size: 12px !important;
          padding: 4px 10px !important;
          border-radius: 999px !important;
          line-height: 1.2 !important;
          background: linear-gradient(135deg, #6366f1, #ec4899) !important;
          color: #fff !important;
          border: none !important;
          box-shadow: 0 2px 6px rgba(79, 70, 229, 0.35);
        }
        .card button:hover,
        .card button:active,
        .card [role="button"]:hover,
        .card [role="button"]:active,
        .card .btn:hover,
        .card .btn:active,
        .card .button:hover,
        .card .button:active {
          background: linear-gradient(135deg, #4f46e5, #db2777) !important;
        }
        .card button:disabled,
        .card [aria-disabled="true"] {
          opacity: 0.55 !important;
          box-shadow: none !important;
        }

        .query-builder,
        .qb-toolbar {
          background: linear-gradient(
            90deg,
            rgba(224, 242, 254, 0.8),
            rgba(237, 233, 254, 0.8)
          );
        }

        .card--right {
          overflow: hidden;
        }
      `}</style>

      <header className="app__header">
        <h1 className="app__title">LoTUS-BF (YJ version)</h1>
        <div className="app__subtitle">
          Location-or-Term Unified Search for Brain Functions
        </div>
        <div className="app__intro">
          <p>
            Use the left panel to search and select terms, build logical queries in
            the middle panel, and explore the corresponding brain activation maps on
            the right.
          </p>
          <ol>
            <li>Search for psychological terms in the left panel.</li>
            <li>Compose a query with AND / OR / NOT in the Query Builder.</li>
            <li>Review matching studies and brain maps for the query.</li>
          </ol>
        </div>
      </header>

      <main className="app__grid" ref={gridRef}>
        <section className="card card--left" style={{ flexBasis: `${sizes[0]}%` }}>
          <div className="card__title">Terms</div>
          <Terms onPickTerm={handlePickTerm} />
        </section>

        <div
          className="resizer"
          aria-label="Resize left/middle"
          onMouseDown={(e) => startDrag(0, e)}
        />

        <section
          className="card card--stack card--middle"
          style={{ flexBasis: `${sizes[1]}%` }}
        >
          <QueryBuilder query={query} setQuery={setQuery} />
          <div className="divider" />
          <Studies query={query} />
        </section>

        <div
          className="resizer"
          aria-label="Resize middle/right"
          onMouseDown={(e) => startDrag(1, e)}
        />

        <section className="card card--right" style={{ flexBasis: `${sizes[2]}%` }}>
          <NiiViewer query={query} />
        </section>
      </main>
    </div>
  )
}
