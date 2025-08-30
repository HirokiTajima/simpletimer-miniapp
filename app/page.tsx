"use client";
import { useState } from "react";
import { create, all } from "mathjs";

// mathjs
const math = create(all, {});

// --- helpers --------------------------------------------------
function addCommas(numStr) {
  if (!/^[-+]?\d+(?:\.\d+)?$/.test(numStr)) return numStr;
  const neg = numStr.startsWith("-");
  const n = neg ? numStr.slice(1) : numStr;
  const [i, d] = n.split(".");
  const withCommas = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (neg ? "-" : "") + withCommas + (d ? "." + d : "");
}
function formatExpr(expr) {
  if (!expr) return "0";
  if (expr === "Error") return "Error";
  return expr.replace(/(^|[^A-Za-z0-9_])(-?\d+(?:\.\d+)?)/g, (_, pre, num) => pre + addCommas(num));
}

export default function Calculator() {
  const [expr, setExpr] = useState("");

  function evaluateExpression() {
    try {
      const scope = {
        ln: (x) => Math.log(x),
        log: (x) => Math.log10(x),
        pi: Math.PI,
        e: Math.E,
      };
      const res = math.evaluate(expr, scope);
      setExpr(String(res));
    } catch {
      setExpr("Error");
    }
  }

  const push = (s) => setExpr((p) => p + s);
  const clearAll = () => setExpr("");
  const backspace = () => setExpr((p) => (p ? p.slice(0, -1) : ""));

  const toggleSign = () => {
    setExpr((p) => {
      const m = /(-?\d+(?:\.\d+)?)\s*$/.exec(p);
      if (!m) return p || "";
      const start = m.index;
      const num = m[1];
      return p.slice(0, start) + (num.startsWith("-") ? num.slice(1) : "-" + num);
    });
  };

  const percent = () => {
    setExpr((p) => {
      const m = /(\d+(?:\.\d+)?)\s*$/.exec(p);
      if (!m) return p || "";
      const start = m.index;
      const num = m[1];
      return p.slice(0, start) + `(${num}/100)`;
    });
  };

  const Btn = ({ children, onClick, variant = "neutral" }) => {
    const base =
      "select-none rounded-xl py-3 text-base font-medium shadow-sm active:translate-y-px transition-colors";
    const styles = {
      neutral: "bg-slate-200 text-slate-900 hover:bg-slate-300",
      op: "bg-slate-300 text-slate-900 hover:bg-slate-400",
      num: "bg-white text-slate-900 hover:bg-slate-100",
      accent: "bg-indigo-500 text-white hover:bg-indigo-600",
      warn: "bg-rose-500 text-white hover:bg-rose-600",
    };
    return (
      <button className={`${base} ${styles[variant]}`} onClick={onClick}>
        {children}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center gap-4 py-6 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-xl p-4">
        <div className="h-16 w-full rounded-2xl bg-slate-900 text-white flex items-center justify-end px-4 text-2xl font-mono overflow-x-auto">
          {formatExpr(expr)}
        </div>

        {/* Row 1: trig & logs */}
        <div className="grid grid-cols-5 gap-2 mt-3">
          <Btn variant="op" onClick={() => push("sin(")}>sin</Btn>
          <Btn variant="op" onClick={() => push("cos(")}>cos</Btn>
          <Btn variant="op" onClick={() => push("tan(")}>tan</Btn>
          <Btn variant="op" onClick={() => push("log(")}>log</Btn>
          <Btn variant="op" onClick={() => push("ln(")}>ln</Btn>
        </div>

        {/* Row 2: constants & power & sqrt & factorial */}
        <div className="grid grid-cols-5 gap-2 mt-2">
          <Btn variant="op" onClick={() => push("e")}>e</Btn>
          <Btn variant="op" onClick={() => push("pi")}>π</Btn>
          <Btn variant="op" onClick={() => push("!")}>x!</Btn>
          <Btn variant="op" onClick={() => push("^")}>xʸ</Btn>
          <Btn variant="op" onClick={() => push("sqrt(")}>√</Btn>
        </div>

        {/* Row 3: AC, (, ), ±, % */}
        <div className="grid grid-cols-5 gap-2 mt-2">
          <Btn variant="warn" onClick={clearAll}>AC</Btn>
          <Btn variant="op" onClick={() => push("(")}> ( </Btn>
          <Btn variant="op" onClick={() => push(")")}> ) </Btn>
          <Btn variant="accent" onClick={toggleSign}>±</Btn>
          <Btn variant="accent" onClick={percent}>%</Btn>
        </div>

        {/* Numbers and ops */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          <Btn variant="num" onClick={() => push("7")}>7</Btn>
          <Btn variant="num" onClick={() => push("8")}>8</Btn>
          <Btn variant="num" onClick={() => push("9")}>9</Btn>
          <Btn variant="accent" onClick={() => push("/")}>÷</Btn>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-2">
          <Btn variant="num" onClick={() => push("4")}>4</Btn>
          <Btn variant="num" onClick={() => push("5")}>5</Btn>
          <Btn variant="num" onClick={() => push("6")}>6</Btn>
          <Btn variant="accent" onClick={() => push("*")}>×</Btn>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-2">
          <Btn variant="num" onClick={() => push("1")}>1</Btn>
          <Btn variant="num" onClick={() => push("2")}>2</Btn>
          <Btn variant="num" onClick={() => push("3")}>3</Btn>
          <Btn variant="accent" onClick={() => push("-")}>−</Btn>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-2">
          <Btn variant="num" onClick={() => push("0")}>0</Btn>
          <Btn variant="num" onClick={() => push(".")}>.</Btn>
          <Btn variant="accent" onClick={backspace}>C</Btn>
          <Btn variant="accent" onClick={() => push("+")}>＋</Btn>
        </div>
        <div className="grid grid-cols-1 gap-2 mt-2">
          <Btn variant="accent" onClick={evaluateExpression}>=</Btn>
        </div>
      </div>

      {/* Ad & Donate area */}
      <div className="w-full max-w-sm space-y-2">
        <div className="bg-amber-100 border border-amber-200 text-amber-900 text-center p-3 rounded-xl">
          📢 <b>Advertising Space Available</b>
          <div className="text-sm opacity-80">Reach verified humans</div>
        </div>
        <button
          onClick={() =>
            alert("Thank you for your support!\\n(Add your crypto address or link here)")
          }
          className="w-full bg-emerald-500 text-white py-2 rounded-xl shadow hover:bg-emerald-600"
        >
          💖 Support Development (Donate)
        </button>
      </div>
    </div>
  );
}
