import React, { useMemo } from "react";
import "./valuation-bar.css";

/**
 * ValuationBar
 * Props:
 *  - currentValue: number
 *  - fairValue: number
 *  - isoCurrency: string (default "USD")
 *  - tolerance: number (default 0.2)  // ±20%
 */
export default function ValuationBar({
  currentValue,
  fairValue,
  isoCurrency = "USD",
  tolerance = 0.2
}) {
  const d = useMemo(() => {
    const cp = Number(currentValue);
    const fv = Number(fairValue);

    if (!Number.isFinite(cp) || !Number.isFinite(fv) || fv <= 0) {
      return { valid: false };
    }

    const low = fv * (1 - tolerance);
    const high = fv * (1 + tolerance);
    const yellowRange = high - low;

    const zone = cp < low ? "green" : cp > high ? "red" : "yellow";
    const inYellowNormalized = Math.max(-1, Math.min(1, (cp - fv) / (fv * tolerance)));
    const severityBelow = Math.max(0, (low - cp) / fv);
    const severityAbove = Math.max(0, (cp - high) / fv);

    let greenPct;
    let yellowPct;
    let redPct;

    if (zone === "yellow") {
      yellowPct = 40;
      const bias = 8 * Math.abs(inYellowNormalized);

      if (inYellowNormalized >= 0) {
        redPct = 30 + bias;
        greenPct = 30 - bias;
      } else {
        greenPct = 30 + bias;
        redPct = 30 - bias;
      }
    } else if (zone === "green") {
      const growth = Math.min(18, severityBelow * 20);
      greenPct = 40 + growth;
      redPct = 20;
      yellowPct = 100 - greenPct - redPct;
    } else {
      const growth = Math.min(18, severityAbove * 20);
      redPct = 40 + growth;
      greenPct = 20;
      yellowPct = 100 - redPct - greenPct;
    }

    const scaleValuePerPct = yellowRange / yellowPct;
    const greenValueSpan = greenPct * scaleValuePerPct;
    const redValueSpan = redPct * scaleValuePerPct;

    const min = low - greenValueSpan;
    const max = high + redValueSpan;
    const range = max - min;

    const pct = (x) => Math.max(0, Math.min(100, ((x - min) / range) * 100));

    const xFair = pct(fv);
    const xCurrent = pct(cp);

    const localeByCurrency = {
      USD: "en-US",
      EUR: "es-ES",
      GBP: "en-GB",
      JPY: "ja-JP",
    };
    const effectiveIso = (isoCurrency || "USD").toUpperCase();
    const formatter = new Intl.NumberFormat(localeByCurrency[effectiveIso] || "en-US", {
      style: "currency",
      currency: effectiveIso,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const formatValue = (value) => formatter.format(value);

    const currentBarWidth = Math.max(0, Math.min(100, xCurrent));
    const fairBarWidth = Math.max(0, Math.min(100, xFair));

    const relativePct = Math.round((Math.abs(cp - fv) / fv) * 100);
    const valuationText = cp < fv ? "Undervalued" : cp > fv ? "Overvalued" : "Fairly valued";
    const indicatorLeft = Math.min(currentBarWidth, fairBarWidth);
    const indicatorWidth = Math.abs(currentBarWidth - fairBarWidth);
    const isCurrentGteFair = cp >= fv;
    const isCurrentGtFair = cp > fv;
    const indicatorColor =
      zone === "green"
        ? "var(--vr-green)"
        : zone === "red"
        ? "var(--vr-red)"
        : "var(--vr-yellow)";

    return {
      valid: true,
      cp,
      fv,
      zone,
      min,
      max,
      low,
      high,
      currentBarWidth,
      fairBarWidth,
      greenPct,
      yellowPct,
      redPct,
      currentLabel: formatValue(cp),
      fairLabel: formatValue(fv),
      relativePct,
      valuationText,
      indicatorLeft,
      indicatorWidth,
      isCurrentGteFair,
      isCurrentGtFair,
      indicatorColor,
    };
  }, [currentValue, fairValue, isoCurrency, tolerance]);

  if (!d.valid) {
    return (
      <div className="vr-wrap">
        <div className="vr-error">Valores inválidos. fairValue debe ser &gt; 0.</div>
      </div>
    );
  }

  return (
    <div className="vr-wrap">
      <div className="vr-canvas">
        <div className="vr-colors">
          <div className="vr-seg vr-green" style={{ width: `${d.greenPct}%` }} />
          <div
            className="vr-seg vr-yellow"
            style={{ left: `${d.greenPct}%`, width: `${d.yellowPct}%` }}
          />
          <div
            className="vr-seg vr-red"
            style={{ left: `${d.greenPct + d.yellowPct}%`, width: `${d.redPct}%` }}
          />

          {/* Barras desde el borde izquierdo */}
          <div
            className="vr-bar vr-current"
            style={{ width: `${d.currentBarWidth}%` }}
          >
            <BarLabel title="Current Price" value={d.currentLabel} />
          </div>
          <div className="vr-bar vr-fair" style={{ width: `${d.fairBarWidth}%` }}>
            <BarLabel title="Fair value" value={d.fairLabel} />
          </div>

          <div
            className="vr-indicator"
            style={{
              left: `${d.indicatorLeft}%`,
              width: `${Math.max(1, d.indicatorWidth)}%`,
              color: d.indicatorColor,
            }}
          >
            <div className="vr-indicatorTop" style={{ backgroundColor: d.indicatorColor }} />
            <div
              className="vr-indicatorText"
              style={
                d.isCurrentGtFair
                  ? { left: "auto", right: "0px", textAlign: "right" }
                  : { left: "0px", right: "auto", textAlign: "left" }
              }
            >
              <div className="vr-indicatorPct">{d.relativePct}%</div>
              <div className="vr-indicatorLabel">{d.valuationText}</div>
            </div>
            <div
              className="vr-indicatorV vr-indicatorLeftLine"
              style={{ height: d.isCurrentGteFair ? "212px" : "132px" }}
            />
            <div
              className="vr-indicatorV vr-indicatorRightLine"
              style={{ height: d.isCurrentGteFair ? "132px" : "212px" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function BarLabel({ title, value }) {
  return (
    <div className="vr-barLabel">
      <div className="vr-barLabelTitle">{title}</div>
      <div className="vr-barLabelValue">{value}</div>
    </div>
  );
}
