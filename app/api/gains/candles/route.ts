import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface GnsBackendOhclResponse {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const pairIndex = sp.get("pairIndex");
  const from = sp.get("from");
  const to = sp.get("to");
  const width = sp.get("width") ?? "5"; // default 5-minute candles

  if (!pairIndex || !from || !to) {
    return NextResponse.json(
      { error: "Required query params: pairIndex, from, to" },
      { status: 400 },
    );
  }

  const url = `https://backend-pricing.eu.gains.trade/charts/${pairIndex}/${from}/${to}/${width}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Upstream ${res.status}`, detail: text.slice(0, 200) },
        { status: 502 },
      );
    }

    const data = (await res.json()) as Record<string, unknown>;
    console.log("[gains/candles] upstream keys:", Object.keys(data));
    console.log("[gains/candles] raw sample:", JSON.stringify(data).slice(0, 500));

    const rows = (data.table ?? []) as GnsBackendOhclResponse[];
    console.log("[gains/candles] parsed rows:", rows.length);
    if (rows.length > 0) {
      console.log("[gains/candles] first row:", JSON.stringify(rows[0]));
      console.log("[gains/candles] last row:", JSON.stringify(rows[rows.length - 1]));
    }

    const candles = rows.map((row) => ({
      time: row.time,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
    }));

    return NextResponse.json(candles);
  } catch (e) {
    console.error("[gains/candles]", e);
    return NextResponse.json({ error: "Failed to fetch candles." }, { status: 502 });
  }
}
