/**
 * ============================================
 *  CALCULATOR — Full JavaScript Logic
 *  Features:
 *    - All arithmetic: +, −, ×, ÷
 *    - Chained operations
 *    - Percentage, toggle sign
 *    - Decimal input
 *    - Clear (AC / C toggle)
 *    - Error handling (division by zero, overflow)
 *    - Real-time expression display
 *    - Keyboard support
 *    - Ripple & animation effects
 * ============================================
 */

"use strict";

/* ── DOM REFS ──────────────────────────────── */
const displayResult  = document.getElementById("result");
const displayExpr    = document.getElementById("expression");
const clearBtn       = document.getElementById("clearBtn");

/* ── CALCULATOR STATE ──────────────────────── */
let state = {
  current:     "0",      // Number currently being typed
  previous:    null,     // Previous operand
  operator:    null,     // Pending operator
  justEvaled:  false,    // Did we just press "="?
  hasDecimal:  false,    // Does current number have a decimal?
  expression:  "",       // Expression shown above the result
};

/* ── HELPERS ───────────────────────────────── */

/** Format large/small numbers for display */
function formatNumber(num) {
  if (isNaN(num) || !isFinite(num)) return "Error";
  const abs = Math.abs(num);
  // Use exponential for very large / very small
  if (abs >= 1e13 || (abs < 1e-6 && abs !== 0)) {
    return parseFloat(num.toPrecision(8)).toExponential();
  }
  // Remove floating point noise
  const result = parseFloat(num.toPrecision(12));
  return String(result);
}

/** Resize font based on text length */
function resizeResult(text) {
  const len = text.length;
  displayResult.classList.remove("large", "medium", "small");
  if (len <= 9)       displayResult.classList.add("large");
  else if (len <= 14) displayResult.classList.add("medium");
  else                displayResult.classList.add("small");
}

/** Update the display */
function updateDisplay(resultText, exprText = "") {
  // Handle error
  if (resultText === "Error") {
    displayResult.classList.add("error");
  } else {
    displayResult.classList.remove("error");
  }
  displayResult.textContent = resultText;
  displayExpr.innerHTML = exprText || "&nbsp;";
  resizeResult(resultText);
}

/** Trigger pop animation on result */
function animateResult() {
  displayResult.classList.remove("animate");
  void displayResult.offsetWidth; // reflow
  displayResult.classList.add("animate");
}

/** Ripple effect on button */
function createRipple(btn, e) {
  const rect   = btn.getBoundingClientRect();
  const size   = Math.max(rect.width, rect.height);
  const x      = (e.clientX || rect.left + rect.width  / 2) - rect.left - size / 2;
  const y      = (e.clientY || rect.top  + rect.height / 2) - rect.top  - size / 2;
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  btn.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}

/** Compute the result of previous op current */
function compute(prev, op, curr) {
  const a = parseFloat(prev);
  const b = parseFloat(curr);
  switch (op) {
    case "+": return a + b;
    case "−": return a - b;
    case "×": return a * b;
    case "÷":
      if (b === 0) return "Error";
      return a / b;
    default:
      return b;
  }
}

/* ── ACTIONS ───────────────────────────────── */

function inputDigit(digit) {
  // After "=" start fresh but keep result as base if new operator follows
  if (state.justEvaled) {
    state.current    = digit;
    state.expression = "";
    state.justEvaled = false;
    clearBtn.textContent = "AC";
  } else if (state.current === "0") {
    state.current = digit; // replace leading zero
  } else {
    if (state.current.length >= 15) return; // max input length
    state.current += digit;
  }
  clearBtn.textContent = "C";
  updateDisplay(state.current, state.expression);
}

function inputDecimal() {
  if (state.justEvaled) {
    state.current    = "0.";
    state.expression = "";
    state.justEvaled = false;
    clearBtn.textContent = "C";
  } else if (!state.current.includes(".")) {
    state.current += ".";
    clearBtn.textContent = "C";
  }
  updateDisplay(state.current, state.expression);
}

function handleOperator(op) {
  // If we already have a pending operator, chain it
  if (state.operator && !state.justEvaled && state.previous !== null) {
    const result = compute(state.previous, state.operator, state.current);
    if (result === "Error") {
      handleError();
      return;
    }
    state.previous = formatNumber(result);
    state.current  = state.previous;
    animateResult();
  } else {
    state.previous = state.current;
  }

  state.operator    = op;
  state.justEvaled  = false;
  state.expression  = `${state.previous} ${op}`;

  // Highlight active operator button
  document.querySelectorAll(".btn-op").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(`.btn-op[data-value="${op}"]`).forEach(b => b.classList.add("active"));

  updateDisplay(state.previous, state.expression);

  // Next digit will start fresh
  state.current = "0";
}

function handleEquals() {
  if (state.operator === null || state.previous === null) return;

  const expr = `${state.previous} ${state.operator} ${state.current} =`;
  const result = compute(state.previous, state.operator, state.current);

  if (result === "Error") {
    handleError();
    return;
  }

  const formatted = formatNumber(result);
  animateResult();

  state.expression = expr;
  state.previous   = formatted;
  state.current    = formatted;
  state.operator   = null;
  state.justEvaled = true;

  document.querySelectorAll(".btn-op").forEach(b => b.classList.remove("active"));
  updateDisplay(formatted, expr);
}

function handleClear() {
  if (clearBtn.textContent === "C" && state.current !== "0") {
    // C = clear current entry
    state.current = "0";
    clearBtn.textContent = "AC";
    updateDisplay(state.current, state.expression);
  } else {
    // AC = full reset
    state = { current: "0", previous: null, operator: null,
              justEvaled: false, hasDecimal: false, expression: "" };
    clearBtn.textContent = "AC";
    document.querySelectorAll(".btn-op").forEach(b => b.classList.remove("active"));
    updateDisplay("0");
  }
}

function handleToggleSign() {
  if (state.current === "0" || state.current === "Error") return;
  state.current = state.current.startsWith("-")
    ? state.current.slice(1)
    : "-" + state.current;
  updateDisplay(state.current, state.expression);
}

function handlePercent() {
  const num = parseFloat(state.current);
  if (isNaN(num)) return;
  let result;
  if (state.operator && state.previous !== null) {
    // e.g. 200 + 10% = 200 + 20
    result = (parseFloat(state.previous) * num) / 100;
  } else {
    result = num / 100;
  }
  state.current = formatNumber(result);
  updateDisplay(state.current, state.expression);
}

function handleError() {
  updateDisplay("Error", "");
  state = { current: "0", previous: null, operator: null,
            justEvaled: false, hasDecimal: false, expression: "" };
  clearBtn.textContent = "AC";
  setTimeout(() => {
    displayResult.classList.remove("error");
    updateDisplay("0");
  }, 1500);
}

/* ── BUTTON CLICK HANDLER ──────────────────── */
document.getElementById("calculator").addEventListener("click", (e) => {
  const btn = e.target.closest(".btn");
  if (!btn) return;

  createRipple(btn, e);

  const action = btn.dataset.action;
  const value  = btn.dataset.value;

  switch (action) {
    case "digit":       inputDigit(value);       break;
    case "operator":    handleOperator(value);   break;
    case "equals":      handleEquals();          break;
    case "clear":       handleClear();           break;
    case "toggle-sign": handleToggleSign();      break;
    case "percent":     handlePercent();         break;
    case "decimal":     inputDecimal();          break;
  }
});

/* ── KEYBOARD SUPPORT ──────────────────────── */
const KEY_MAP = {
  "0": ["digit", "0"],      "1": ["digit", "1"],
  "2": ["digit", "2"],      "3": ["digit", "3"],
  "4": ["digit", "4"],      "5": ["digit", "5"],
  "6": ["digit", "6"],      "7": ["digit", "7"],
  "8": ["digit", "8"],      "9": ["digit", "9"],
  ".": ["decimal", null],   ",": ["decimal", null],
  "+": ["operator", "+"],   "-": ["operator", "−"],
  "*": ["operator", "×"],   "x": ["operator", "×"],
  "/": ["operator", "÷"],
  "Enter": ["equals", null], "=": ["equals", null],
  "Escape": ["clear", null], "Delete": ["clear", null],
  "Backspace": ["backspace", null],
  "%": ["percent", null],
};

document.addEventListener("keydown", (e) => {
  // Ignore if modifier keys (except shift for operators)
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  const mapping = KEY_MAP[e.key];
  if (!mapping) return;
  e.preventDefault();

  const [action, value] = mapping;

  // Visual feedback: highlight matching button
  let selector = null;
  if (action === "digit")    selector = `.btn[data-action="digit"][data-value="${value}"]`;
  if (action === "operator") selector = `.btn[data-action="operator"][data-value="${value}"]`;
  if (action === "equals")   selector = `.btn[data-action="equals"]`;
  if (action === "clear")    selector = `.btn[data-action="clear"]`;
  if (action === "decimal")  selector = `.btn[data-action="decimal"]`;
  if (action === "percent")  selector = `.btn[data-action="percent"]`;

  if (selector) {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.classList.add("key-active");
      createRipple(btn, {});
      setTimeout(() => btn.classList.remove("key-active"), 140);
    }
  }

  switch (action) {
    case "digit":     inputDigit(value);     break;
    case "operator":  handleOperator(value); break;
    case "equals":    handleEquals();        break;
    case "clear":     handleClear();         break;
    case "decimal":   inputDecimal();        break;
    case "percent":   handlePercent();       break;
    case "backspace":
      if (state.justEvaled) { handleClear(); break; }
      if (state.current.length === 1 || (state.current.length === 2 && state.current.startsWith("-"))) {
        state.current = "0";
        clearBtn.textContent = "AC";
      } else {
        state.current = state.current.slice(0, -1);
      }
      updateDisplay(state.current, state.expression);
      break;
  }
});

/* ── INIT ──────────────────────────────────── */
updateDisplay("0");
