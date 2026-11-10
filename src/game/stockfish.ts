import { DIFFICULTY_CONFIG, type Difficulty } from './types'

type ReadyResolver = () => void
type MoveResolver = (uci: string) => void
type MoveRejecter = (error: Error) => void

/**
 * Stockfish answers `stop` with a `bestmove`. If a new search is already
 * pending, that stopped bestmove must be ignored or it resolves the wrong go.
 */
export class StockfishEngine {
  private worker: Worker | null = null
  private ready = false
  private readyWaiters: ReadyResolver[] = []
  private pending: { resolve: MoveResolver; reject: MoveRejecter } | null = null
  /** Drain this many bestmove lines (from stop) before trusting a result. */
  private ignoreBestMoves = 0
  private started = false
  /** Serialize callers so only one search owns the worker at a time. */
  private tail: Promise<void> = Promise.resolve()

  async init(): Promise<void> {
    if (this.started) {
      await this.waitReady()
      return
    }
    this.started = true

    this.worker = new Worker('/engine/stockfish-19-lite-single.js')
    this.worker.onmessage = (event: MessageEvent<string>) => {
      this.handleMessage(String(event.data))
    }
    this.worker.onerror = (event) => {
      console.error('Stockfish worker error', event)
      this.pending?.reject(new Error('Stockfish worker failed'))
      this.pending = null
    }

    this.post('uci')
    await this.waitReady()
    this.post('ucinewgame')
  }

  async getBestMove(fen: string, difficulty: Difficulty): Promise<string> {
    await this.init()
    if (!this.worker) throw new Error('Engine not available')

    const run = this.tail.then(() => this.search(fen, difficulty))
    // Keep the chain alive even when a search rejects (cancel / illegal).
    this.tail = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  }

  dispose(): void {
    this.post('quit')
    this.worker?.terminate()
    this.worker = null
    this.ready = false
    this.started = false
    this.ignoreBestMoves = 0
    this.pending?.reject(new Error('Engine disposed'))
    this.pending = null
  }

  private async search(fen: string, difficulty: Difficulty): Promise<string> {
    if (this.pending) {
      this.post('stop')
      this.ignoreBestMoves += 1
      this.pending.reject(new Error('Search cancelled'))
      this.pending = null
    }

    const config = DIFFICULTY_CONFIG[difficulty]

    if (config.uciElo != null) {
      this.post('setoption name UCI_LimitStrength value true')
      this.post(`setoption name UCI_Elo value ${config.uciElo}`)
    } else {
      this.post('setoption name UCI_LimitStrength value false')
    }
    this.post(`setoption name Skill Level value ${config.skillLevel}`)
    this.post(`position fen ${fen}`)

    return new Promise<string>((resolve, reject) => {
      this.pending = { resolve, reject }
      // movetime alone — combining with depth made easy/normal return instantly
      // and hammer the autopilot loop.
      this.post(`go movetime ${config.moveTimeMs}`)
    })
  }

  private post(command: string): void {
    this.worker?.postMessage(command)
  }

  private waitReady(): Promise<void> {
    if (this.ready) return Promise.resolve()
    return new Promise((resolve) => {
      this.readyWaiters.push(resolve)
    })
  }

  private handleMessage(line: string): void {
    if (line === 'uciok' || line === 'readyok') {
      if (!this.ready) {
        this.ready = true
        this.readyWaiters.splice(0).forEach((resolve) => resolve())
      }
      return
    }

    if (line.startsWith('bestmove')) {
      if (this.ignoreBestMoves > 0) {
        this.ignoreBestMoves -= 1
        return
      }

      const match = line.match(/^bestmove\s+(\S+)/)
      const move = match?.[1]
      if (move && move !== '(none)' && this.pending) {
        const { resolve } = this.pending
        this.pending = null
        resolve(move)
      } else if (this.pending) {
        const { reject } = this.pending
        this.pending = null
        reject(new Error(`No legal move from engine: ${line}`))
      }
    }
  }
}

export const stockfish = new StockfishEngine()

export function uciToMove(uci: string): {
  from: string
  to: string
  promotion?: string
} {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : undefined,
  }
}
