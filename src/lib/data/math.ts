// Math Sprint generator. Server picks operands and an operator, then the
// client must type the integer answer. First correct answer wins the round.
export type MathProblem = {
  id: string;
  prompt: string;
  answer: number;
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateMathProblem(difficulty: "easy" | "medium" | "hard" = "medium"): MathProblem {
  const ops: Array<"+" | "-" | "×" | "÷"> = ["+", "-", "×", "÷"];
  // Weight: easy skips divide; hard favors ×/÷.
  const op =
    difficulty === "easy"
      ? (["+", "-", "×"] as const)[randInt(0, 2)]
      : difficulty === "hard"
        ? ops[randInt(0, 3)]
        : ops[randInt(0, 3)];

  let a = 0;
  let b = 0;
  let answer = 0;
  let prompt = "";

  switch (op) {
    case "+":
      a = randInt(difficulty === "hard" ? 20 : 5, difficulty === "hard" ? 99 : 50);
      b = randInt(difficulty === "hard" ? 20 : 5, difficulty === "hard" ? 99 : 50);
      answer = a + b;
      prompt = `${a} + ${b}`;
      break;
    case "-":
      a = randInt(difficulty === "hard" ? 40 : 20, 99);
      b = randInt(5, a);
      answer = a - b;
      prompt = `${a} − ${b}`;
      break;
    case "×":
      a = randInt(2, difficulty === "hard" ? 19 : 12);
      b = randInt(2, difficulty === "hard" ? 19 : 12);
      answer = a * b;
      prompt = `${a} × ${b}`;
      break;
    case "÷": {
      // Ensure integer result.
      const divisor = randInt(2, 12);
      const quotient = randInt(2, difficulty === "hard" ? 19 : 12);
      a = divisor * quotient;
      b = divisor;
      answer = quotient;
      prompt = `${a} ÷ ${b}`;
      break;
    }
  }
  return {
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    prompt,
    answer,
  };
}
