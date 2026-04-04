"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  ColorType,
  CrosshairMode,
} from "lightweight-charts"

interface GainsCandlestickChartProps {
  pairIndex: number
  /** Candle width in minutes (default: 5) */
  widthMinutes?: number
  /** How many hours of history to show (default: 4) */
  historyHours?: number
  /** Auto-refresh interval in seconds (default: 30) */
  refreshInterval?: number
  /** Chart height in pixels (default: 400) */
  height?: number
  /** Optional pair name to display */
  pairName?: string
}

interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
}

export default function GainsCandlestickChart({
  pairIndex,
  widthMinutes = 5,
  historyHours = 4,
  refreshInterval = 30,
  height = 400,
  pairName,
}: GainsCandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const initialFitDone = useRef(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCandles = useCallback(async (): Promise<Candle[]> => {
    const now = Math.floor(Date.now() / 1000)
    const from = now - historyHours * 3600

    const params = new URLSearchParams({
      pairIndex: String(pairIndex),
      from: String(from),
      to: String(now),
      width: String(widthMinutes),
    })

    const res = await fetch(`/api/gains/candles?${params}`)
    if (!res.ok) throw new Error(`Failed to fetch candles: ${res.status}`)
    return res.json()
  }, [pairIndex, historyHours, widthMinutes])

  // Create chart + fetch data in a single effect to avoid race conditions
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(65, 245, 240, 0.6)",
        fontFamily: "var(--font-share-tech), monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(65, 245, 240, 0.06)" },
        horzLines: { color: "rgba(65, 245, 240, 0.06)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(65, 245, 240, 0.3)",
          labelBackgroundColor: "#1a0a2e",
        },
        horzLine: {
          color: "rgba(65, 245, 240, 0.3)",
          labelBackgroundColor: "#1a0a2e",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(65, 245, 240, 0.15)",
      },
      timeScale: {
        borderColor: "rgba(65, 245, 240, 0.15)",
        timeVisible: true,
        secondsVisible: false,
      },
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#41f5f0",
      downColor: "#ff3d9a",
      borderUpColor: "#41f5f0",
      borderDownColor: "#ff3d9a",
      wickUpColor: "rgba(65, 245, 240, 0.6)",
      wickDownColor: "rgba(255, 61, 154, 0.6)",
    })

    chartRef.current = chart
    seriesRef.current = series
    initialFitDone.current = false

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    })
    ro.observe(containerRef.current)

    // Data fetching
    let cancelled = false

    const load = async () => {
      try {
        setError(null)
        const candles = await fetchCandles()
        if (cancelled) return

        console.log("[chart] fetched", candles.length, "candles")
        if (candles.length > 0) {
          const last = candles[candles.length - 1]
          console.log("[chart] last candle:", { time: last.time, open: last.open, high: last.high, low: last.low, close: last.close })
          console.log("[chart] first candle time:", candles[0].time, "last candle time:", last.time)
        }

        const data: CandlestickData<Time>[] = candles.map((c) => ({
          time: c.time as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))

        console.log("[chart] calling setData with", data.length, "entries")
        series.setData(data)

        // Only fit content on first load, not on every refresh
        if (!initialFitDone.current) {
          chart.timeScale().fitContent()
          initialFitDone.current = true
          console.log("[chart] initial fitContent done")
        }

        setLoading(false)
      } catch (err) {
        console.error("[chart] fetch error:", err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error")
          setLoading(false)
        }
      }
    }

    load()
    const timer = setInterval(load, refreshInterval * 1000)

    return () => {
      cancelled = true
      clearInterval(timer)
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [height, fetchCandles, refreshInterval])

  return (
    <div className="relative overflow-hidden rounded-sm border-2 border-[var(--game-cyan-dim)] bg-[var(--game-bg-elevated)] w-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--game-cyan-dim)] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-orbitron)] text-xs font-bold uppercase tracking-wider text-[var(--game-cyan)]">
            {pairName ?? `Pair #${pairIndex}`}
          </span>
          <span className="text-[10px] text-[var(--game-text-muted)]">
            {widthMinutes}m
          </span>
        </div>
        {loading && (
          <span className="text-[10px] uppercase tracking-wider text-[var(--game-amber)] animate-pulse">
            Loading...
          </span>
        )}
      </div>

      {/* Chart container */}
      <div ref={containerRef} style={{ height }} />

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[rgba(4,2,12,0.85)]">
          <p className="text-sm text-[var(--game-danger)]">{error}</p>
        </div>
      )}
    </div>
  )
}
