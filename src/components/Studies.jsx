import { API_BASE } from '../api'
import { useEffect, useMemo, useState } from 'react'

function classNames (...xs) { return xs.filter(Boolean).join(' ') }

export function Studies ({ query }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [sortKey, setSortKey] = useState('year')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => { setPage(1) }, [query])

  useEffect(() => {
    if (!query) {
      setRows([])
      setErr('')
      setLoading(false)
      return
    }
    let alive = true
    const ac = new AbortController()
    ;(async () => {
      setLoading(true)
      setErr('')
      try {
        const url = `${API_BASE}/query/${encodeURIComponent(query)}/studies`
        const res = await fetch(url, { signal: ac.signal })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
        if (!alive) return
        const list = Array.isArray(data?.results) ? data.results : []
        setRows(list)
      } catch (e) {
        if (!alive) return
        setErr(`Unable to fetch studies: ${e?.message || e}`)
        setRows([])
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false; ac.abort() }
  }, [query])

  const changeSort = (key) => {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    const arr = [...rows]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      const A = a?.[sortKey]
      const B = b?.[sortKey]
      if (sortKey === 'year') return (Number(A || 0) - Number(B || 0)) * dir
      return String(A || '').localeCompare(String(B || ''), 'en') * dir
    })
    return arr
  }, [rows, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className='flex h-full flex-col rounded-2xl border border-gray-200 bg-white/90'>
      {/* header */}
      <div className='flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-indigo-500/90 via-fuchsia-500/90 to-rose-500/90 px-3 py-2 text-xs text-white'>
        <div className='font-semibold'>
          Studies{' '}
          {query && !loading && !err && (
            <span className='ml-1 text-[11px] font-normal opacity-90'>
              ({sorted.length} found)
            </span>
          )}
        </div>
        <div className='max-w-[260px] truncate text-right opacity-90'>
          {query
            ? `Query: ${query}`
            : 'Build a query to see matching studies.'}
        </div>
      </div>

      {/* no query yet */}
      {!query && (
        <div className='flex flex-1 items-center justify-center p-4 text-sm text-gray-500'>
          Build a query in the Query Builder to see matching studies here.
        </div>
      )}

      {/* loading skeleton */}
      {query && loading && (
        <div className='grid gap-3 p-3'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='h-9 animate-pulse rounded-lg bg-indigo-50' />
          ))}
        </div>
      )}

      {/* error */}
      {query && err && !loading && (
        <div className='m-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
          {err}
        </div>
      )}

      {/* table */}
      {query && !loading && !err && (
        <div className='flex-1 overflow-auto'>
          <table className='min-w-full text-sm'>
            <thead className='sticky top-0 bg-indigo-50/90 text-left text-[13px] text-slate-700'>
              <tr>
                {[
                  { key: 'year', label: 'Year' },
                  { key: 'journal', label: 'Journal' },
                  { key: 'title', label: 'Title' },
                  { key: 'authors', label: 'Authors' }
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    className='cursor-pointer px-3 py-2 font-semibold'
                    onClick={() => changeSort(key)}
                  >
                    <span className='inline-flex items-center gap-1'>
                      {label}
                      <span className='text-[10px] text-indigo-500'>
                        {sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className='px-3 py-4 text-gray-500'>
                    No studies match this query.
                  </td>
                </tr>
              ) : (
                pageRows.map((r, i) => (
                  <tr
                    key={i}
                    className={classNames(
                      i % 2 ? 'bg-white' : 'bg-indigo-50/40',
                      'align-top'
                    )}
                  >
                    <td className='whitespace-nowrap px-3 py-2'>
                      {r.year ?? ''}
                    </td>
                    <td className='px-3 py-2'>{r.journal || ''}</td>
                    <td className='max-w-[540px] px-3 py-2'>
                      <div className='truncate' title={r.title}>
                        {r.title || ''}
                      </div>
                    </td>
                    <td className='px-3 py-2'>{r.authors || ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* footer / pagination */}
      {query && !loading && !err && (
        <div className='flex items-center justify-between border-t px-3 py-2 text-xs text-gray-600 bg-slate-50/80 rounded-b-2xl'>
          <div>
            Total <b>{sorted.length}</b> records, page <b>{page}</b> /{' '}
            <b>{totalPages}</b>
          </div>
          <div className='flex items-center gap-1'>
            <button
              disabled={page <= 1}
              onClick={() => setPage(1)}
              className='rounded-full border px-2 py-1 disabled:opacity-40'
            >
              ⏮
            </button>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className='rounded-full border px-2 py-1 disabled:opacity-40'
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className='rounded-full border px-2 py-1 disabled:opacity-40'
            >
              Next
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              className='rounded-full border px-2 py-1 disabled:opacity-40'
            >
              ⏭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
