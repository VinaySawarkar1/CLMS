/**
 * CLMS Formula Engine
 * -------------------
 * A small, dependency-free expression evaluator with Excel-like semantics,
 * used by the datasheet engine for formula cells.
 *
 * Supports:
 *   operators: + - * / ^  and unary minus
 *   functions: SQRT ABS ROUND IF AVERAGE SUM MAX MIN LOG SIN COS TAN
 *   variables: named cell references resolved from a context object
 *
 * Usage:
 *   evaluate('ROUND(AVERAGE(a, b) - std, 3)', { a: 10.1, b: 10.3, std: 10 })
 */

type Token =
  | { type: 'num'; value: number }
  | { type: 'ident'; value: string }
  | { type: 'op'; value: string }
  | { type: 'paren'; value: '(' | ')' }
  | { type: 'comma' };

export type FormulaContext = Record<string, number>;

const FUNCTIONS: Record<string, (args: number[]) => number> = {
  SQRT: (a) => Math.sqrt(a[0]),
  ABS: (a) => Math.abs(a[0]),
  ROUND: (a) => {
    const digits = a[1] ?? 0;
    const f = Math.pow(10, digits);
    return Math.round(a[0] * f) / f;
  },
  IF: (a) => (a[0] ? a[1] : a[2]),
  AVERAGE: (a) => a.reduce((s, x) => s + x, 0) / a.length,
  SUM: (a) => a.reduce((s, x) => s + x, 0),
  MAX: (a) => Math.max(...a),
  MIN: (a) => Math.min(...a),
  LOG: (a) => (a.length > 1 ? Math.log(a[0]) / Math.log(a[1]) : Math.log(a[0])),
  SIN: (a) => Math.sin(a[0]),
  COS: (a) => Math.cos(a[0]),
  TAN: (a) => Math.tan(a[0]),
};

const PRECEDENCE: Record<string, number> = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
  '^': 3,
};

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const c = input[i];
    if (c === ' ' || c === '\t' || c === '\n') {
      i++;
      continue;
    }
    if (c >= '0' && c <= '9') {
      let num = '';
      while (i < input.length && /[0-9.]/.test(input[i])) num += input[i++];
      tokens.push({ type: 'num', value: parseFloat(num) });
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let id = '';
      while (i < input.length && /[A-Za-z0-9_]/.test(input[i])) id += input[i++];
      tokens.push({ type: 'ident', value: id });
      continue;
    }
    if (c === '(' || c === ')') {
      tokens.push({ type: 'paren', value: c });
      i++;
      continue;
    }
    if (c === ',') {
      tokens.push({ type: 'comma' });
      i++;
      continue;
    }
    if ('+-*/^'.includes(c)) {
      tokens.push({ type: 'op', value: c });
      i++;
      continue;
    }
    throw new Error(`Unexpected character '${c}' at position ${i}`);
  }
  return tokens;
}

/** Recursive-descent parser/evaluator. */
class Parser {
  private pos = 0;
  constructor(
    private readonly tokens: Token[],
    private readonly ctx: FormulaContext,
  ) {}

  evaluate(): number {
    const value = this.parseExpression(0);
    if (this.pos < this.tokens.length) {
      throw new Error('Unexpected trailing tokens in formula');
    }
    return value;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private parseExpression(minPrec: number): number {
    let left = this.parseUnary();
    while (true) {
      const tok = this.peek();
      if (!tok || tok.type !== 'op') break;
      const prec = PRECEDENCE[tok.value];
      if (prec < minPrec) break;
      this.pos++;
      // '^' is right-associative
      const nextMin = tok.value === '^' ? prec : prec + 1;
      const right = this.parseExpression(nextMin);
      left = this.applyOp(tok.value, left, right);
    }
    return left;
  }

  private parseUnary(): number {
    const tok = this.peek();
    if (tok && tok.type === 'op' && tok.value === '-') {
      this.pos++;
      return -this.parseUnary();
    }
    if (tok && tok.type === 'op' && tok.value === '+') {
      this.pos++;
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): number {
    const tok = this.peek();
    if (!tok) throw new Error('Unexpected end of formula');

    if (tok.type === 'num') {
      this.pos++;
      return tok.value;
    }
    if (tok.type === 'paren' && tok.value === '(') {
      this.pos++;
      const value = this.parseExpression(0);
      this.expect(')');
      return value;
    }
    if (tok.type === 'ident') {
      this.pos++;
      const next = this.peek();
      if (next && next.type === 'paren' && next.value === '(') {
        return this.parseFunctionCall(tok.value);
      }
      const upper = tok.value.toUpperCase();
      if (upper === 'PI') return Math.PI;
      if (upper === 'E') return Math.E;
      if (!(tok.value in this.ctx)) {
        throw new Error(`Unknown variable '${tok.value}'`);
      }
      return this.ctx[tok.value];
    }
    throw new Error(`Unexpected token in formula`);
  }

  private parseFunctionCall(name: string): number {
    const fn = FUNCTIONS[name.toUpperCase()];
    if (!fn) throw new Error(`Unknown function '${name}'`);
    this.expect('(');
    const args: number[] = [];
    if (!(this.peek()?.type === 'paren' && (this.peek() as any).value === ')')) {
      args.push(this.parseExpression(0));
      while (this.peek()?.type === 'comma') {
        this.pos++;
        args.push(this.parseExpression(0));
      }
    }
    this.expect(')');
    return fn(args);
  }

  private applyOp(op: string, a: number, b: number): number {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return a / b;
      case '^': return Math.pow(a, b);
      default: throw new Error(`Unknown operator '${op}'`);
    }
  }

  private expect(paren: '(' | ')') {
    const tok = this.peek();
    if (!tok || tok.type !== 'paren' || tok.value !== paren) {
      throw new Error(`Expected '${paren}'`);
    }
    this.pos++;
  }
}

export function evaluate(formula: string, ctx: FormulaContext = {}): number {
  const tokens = tokenize(formula);
  return new Parser(tokens, ctx).evaluate();
}
