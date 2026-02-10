import { SessionState } from '../../../shared/types/session.js';

type TokenType = 'VAR' | 'OP' | 'VALUE' | 'AND' | 'OR' | 'NOT' | 'LPAREN' | 'RPAREN' | 'FUNC' | 'COMMA';

interface Token {
  type: TokenType;
  value: string;
}

export class ConditionParser {
  /**
   * Evaluate a condition expression against the current session state.
   */
  evaluate(condition: string, session: SessionState): boolean {
    const trimmed = condition.trim();

    // Special case: "always" means always true
    if (trimmed === 'always' || trimmed === 'true') return true;
    if (trimmed === 'never' || trimmed === 'false') return false;

    try {
      const tokens = this.tokenize(trimmed);
      const result = this.parseExpression(tokens, 0, session);
      return result.value;
    } catch (e) {
      console.error(`Failed to parse condition: "${condition}"`, e);
      return false;
    }
  }

  private tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < input.length) {
      // Skip whitespace
      if (input[i] === ' ' || input[i] === '\t') {
        i++;
        continue;
      }

      // Parentheses
      if (input[i] === '(') {
        tokens.push({ type: 'LPAREN', value: '(' });
        i++;
        continue;
      }
      if (input[i] === ')') {
        tokens.push({ type: 'RPAREN', value: ')' });
        i++;
        continue;
      }

      // Comma
      if (input[i] === ',') {
        tokens.push({ type: 'COMMA', value: ',' });
        i++;
        continue;
      }

      // Operators
      if (input.substring(i, i + 2) === '==') {
        tokens.push({ type: 'OP', value: '==' });
        i += 2;
        continue;
      }
      if (input.substring(i, i + 2) === '!=') {
        tokens.push({ type: 'OP', value: '!=' });
        i += 2;
        continue;
      }
      if (input.substring(i, i + 2) === '>=') {
        tokens.push({ type: 'OP', value: '>=' });
        i += 2;
        continue;
      }
      if (input.substring(i, i + 2) === '<=') {
        tokens.push({ type: 'OP', value: '<=' });
        i += 2;
        continue;
      }
      if (input[i] === '>') {
        tokens.push({ type: 'OP', value: '>' });
        i++;
        continue;
      }
      if (input[i] === '<') {
        tokens.push({ type: 'OP', value: '<' });
        i++;
        continue;
      }

      // String literals
      if (input[i] === "'" || input[i] === '"') {
        const quote = input[i];
        let str = '';
        i++;
        while (i < input.length && input[i] !== quote) {
          str += input[i];
          i++;
        }
        i++; // skip closing quote
        tokens.push({ type: 'VALUE', value: str });
        continue;
      }

      // Numbers
      if (input[i] >= '0' && input[i] <= '9' || input[i] === '-') {
        let num = input[i];
        i++;
        while (i < input.length && ((input[i] >= '0' && input[i] <= '9') || input[i] === '.')) {
          num += input[i];
          i++;
        }
        tokens.push({ type: 'VALUE', value: num });
        continue;
      }

      // Keywords and identifiers
      if (/[a-zA-Z_]/.test(input[i])) {
        let ident = '';
        while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
          ident += input[i];
          i++;
        }

        if (ident === 'AND') {
          tokens.push({ type: 'AND', value: 'AND' });
        } else if (ident === 'OR') {
          tokens.push({ type: 'OR', value: 'OR' });
        } else if (ident === 'NOT') {
          tokens.push({ type: 'NOT', value: 'NOT' });
        } else if (ident === 'true') {
          tokens.push({ type: 'VALUE', value: 'true' });
        } else if (ident === 'false') {
          tokens.push({ type: 'VALUE', value: 'false' });
        } else if (ident === 'has_all' || ident === 'visited') {
          tokens.push({ type: 'FUNC', value: ident });
        } else {
          tokens.push({ type: 'VAR', value: ident });
        }
        continue;
      }

      i++;
    }

    return tokens;
  }

  private parseExpression(
    tokens: Token[],
    pos: number,
    session: SessionState
  ): { value: boolean; pos: number } {
    let result = this.parsePrimary(tokens, pos, session);

    while (result.pos < tokens.length) {
      const token = tokens[result.pos];
      if (token.type === 'AND') {
        const right = this.parsePrimary(tokens, result.pos + 1, session);
        result = { value: result.value && right.value, pos: right.pos };
      } else if (token.type === 'OR') {
        const right = this.parsePrimary(tokens, result.pos + 1, session);
        result = { value: result.value || right.value, pos: right.pos };
      } else {
        break;
      }
    }

    return result;
  }

  private parsePrimary(
    tokens: Token[],
    pos: number,
    session: SessionState
  ): { value: boolean; pos: number } {
    if (pos >= tokens.length) return { value: false, pos };

    const token = tokens[pos];

    // NOT expression
    if (token.type === 'NOT') {
      const inner = this.parsePrimary(tokens, pos + 1, session);
      return { value: !inner.value, pos: inner.pos };
    }

    // Parenthesized expression
    if (token.type === 'LPAREN') {
      const inner = this.parseExpression(tokens, pos + 1, session);
      // Skip closing paren
      const nextPos = inner.pos < tokens.length && tokens[inner.pos]?.type === 'RPAREN'
        ? inner.pos + 1
        : inner.pos;
      return { value: inner.value, pos: nextPos };
    }

    // Function calls
    if (token.type === 'FUNC') {
      return this.parseFunction(tokens, pos, session);
    }

    // Variable with comparison or truthy check
    if (token.type === 'VAR') {
      const varName = token.value;

      // Special variable: turn_count
      if (varName === 'turn_count') {
        if (pos + 1 < tokens.length && tokens[pos + 1].type === 'OP') {
          const op = tokens[pos + 1].value;
          const val = tokens[pos + 2].value;
          return {
            value: this.compare(session.turn_count_garden, op, this.parseValue(val)),
            pos: pos + 3,
          };
        }
        return { value: session.turn_count_garden > 0, pos: pos + 1 };
      }

      // Check scoring matrix first, then variables
      const varValue = this.getVariable(varName, session);

      // Comparison
      if (pos + 1 < tokens.length && tokens[pos + 1].type === 'OP') {
        const op = tokens[pos + 1].value;
        const val = tokens[pos + 2].value;
        return {
          value: this.compare(varValue, op, this.parseValue(val)),
          pos: pos + 3,
        };
      }

      // Truthy check
      return { value: !!varValue, pos: pos + 1 };
    }

    // Boolean value
    if (token.type === 'VALUE') {
      return { value: this.parseValue(token.value) === true, pos: pos + 1 };
    }

    return { value: false, pos: pos + 1 };
  }

  private parseFunction(
    tokens: Token[],
    pos: number,
    session: SessionState
  ): { value: boolean; pos: number } {
    const funcName = tokens[pos].value;
    pos++; // skip function name

    // Skip LPAREN
    if (pos < tokens.length && tokens[pos].type === 'LPAREN') pos++;

    const args: string[] = [];
    while (pos < tokens.length && tokens[pos].type !== 'RPAREN') {
      if (tokens[pos].type === 'COMMA') {
        pos++;
        continue;
      }
      args.push(tokens[pos].value);
      pos++;
    }

    // Skip RPAREN
    if (pos < tokens.length && tokens[pos].type === 'RPAREN') pos++;

    switch (funcName) {
      case 'has_all':
        return {
          value: args.every(varName => !!this.getVariable(varName, session)),
          pos,
        };
      case 'visited':
        return {
          value: args.every(gardenId => session.visited_gardens.includes(gardenId)),
          pos,
        };
      default:
        return { value: false, pos };
    }
  }

  private getVariable(name: string, session: SessionState): unknown {
    // Check scoring matrix first
    if (session.scoring_matrix[name]) {
      return session.scoring_matrix[name].value;
    }
    // Then check variables
    return session.variables[name];
  }

  private parseValue(val: string): unknown {
    if (val === 'true') return true;
    if (val === 'false') return false;
    const num = Number(val);
    if (!isNaN(num)) return num;
    return val;
  }

  private compare(left: unknown, op: string, right: unknown): boolean {
    switch (op) {
      case '==': return left == right;
      case '!=': return left != right;
      case '>': return Number(left) > Number(right);
      case '<': return Number(left) < Number(right);
      case '>=': return Number(left) >= Number(right);
      case '<=': return Number(left) <= Number(right);
      default: return false;
    }
  }
}
