import { useId } from 'react'
import styles from './TuringMachineDiagram.module.css'

export function TuringMachineDiagram() {
  const instanceId = useId().replaceAll(':', '')
  const titleId = `turing-machine-${instanceId}-title`
  const descriptionId = `turing-machine-${instanceId}-description`

  return (
    <div className={styles.viewport}>
      <svg
        className={styles.diagram}
        viewBox="80 88 640 632"
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
      >
        <title id={titleId}>Turing machine</title>
        <desc id={descriptionId}>
          An exploded Turing machine shows the tape, read and write head, current state, and the
          transition rule that changes the symbol and moves the head right.
        </desc>
        <g data-exploded="" data-origin="220 480" data-gap="92">
          <line
            data-role="trace"
            x1="92"
            y1="544"
            x2="92"
            y2="216"
            stroke="rgba(28,25,21,0.30)"
            strokeWidth="0.8"
            strokeDasharray="4,3"
          />
          <line
            data-role="trace"
            x1="460"
            y1="600"
            x2="460"
            y2="272"
            stroke="rgba(28,25,21,0.30)"
            strokeWidth="0.8"
            strokeDasharray="4,3"
          />
          <g
            data-part="tape"
            data-name="Tape"
            data-rect="0 0 240 128 0"
            data-z="0"
            data-t="12"
            data-level="0"
          >
            <path
              data-role="silhouette"
              d="M220 468 L460 588 L460 600 L332 664 L92 544 L92 532 Z"
              fill="var(--paper-hi)"
            />
            <polygon points="460,588 332,652 332,664 460,600" fill="rgba(28,25,21,0.15)" />
            <polygon points="332,652 92,532 92,544 332,664" fill="rgba(28,25,21,0.07)" />
            <polygon points="220,468 460,588 332,652 92,532" fill="var(--paper-hi)" />
            <polygon
              points="200,498 240,518 192,542 152,522"
              fill="var(--paper)"
              stroke="rgba(28,25,21,0.32)"
              strokeWidth="0.8"
            />
            <polygon
              points="240,518 280,538 232,562 192,542"
              fill="var(--paper)"
              stroke="rgba(28,25,21,0.32)"
              strokeWidth="0.8"
            />
            <polygon
              points="280,538 320,558 272,582 232,562"
              fill="var(--paper)"
              stroke="rgba(28,25,21,0.32)"
              strokeWidth="0.8"
            />
            <polygon
              points="320,558 360,578 312,602 272,582"
              fill="var(--paper)"
              stroke="rgba(28,25,21,0.32)"
              strokeWidth="0.8"
            />
            <polygon
              points="360,578 400,598 352,622 312,602"
              fill="var(--paper)"
              stroke="rgba(28,25,21,0.32)"
              strokeWidth="0.8"
            />
            <g transform="matrix(1,0.5,-1,0.5,220,468)">
              <text
                x="40"
                y="71"
                fill="var(--ink-2)"
                fontSize="14"
                fontFamily="'IBM Plex Mono', monospace"
                textAnchor="middle"
              >
                0
              </text>
              <text
                x="80"
                y="71"
                fill="var(--ink-2)"
                fontSize="14"
                fontFamily="'IBM Plex Mono', monospace"
                textAnchor="middle"
              >
                1
              </text>
              <text
                x="120"
                y="71"
                fill="var(--ink-2)"
                fontSize="14"
                fontFamily="'IBM Plex Mono', monospace"
                textAnchor="middle"
              >
                1
              </text>
              <text
                x="160"
                y="71"
                fill="var(--ink-2)"
                fontSize="14"
                fontFamily="'IBM Plex Mono', monospace"
                textAnchor="middle"
              >
                0
              </text>
              <text
                x="200"
                y="71"
                fill="var(--ink-2)"
                fontSize="14"
                fontFamily="'IBM Plex Mono', monospace"
                textAnchor="middle"
              >
                1
              </text>
            </g>
            <path
              d="M220 468 L460 588 L460 600 L332 664 L92 544 L92 532 Z"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <g data-role="label">
              <line
                data-role="leader"
                x1="466"
                y1="594"
                x2="568"
                y2="594"
                stroke="rgba(28,25,21,0.40)"
                strokeWidth="0.8"
              />
              <circle cx="460" cy="594" r="2" fill="var(--ink)" />
              <text className={styles.partName} data-role="name" x="580" y="590">
                Tape
              </text>
              <text
                x="580"
                y="610"
                fill="var(--ink-2)"
                fontSize="10"
                fontFamily="'IBM Plex Mono', monospace"
                letterSpacing="0.08em"
              >
                0 / 1 / 1 / 0 / 1
              </text>
            </g>
          </g>
          <g
            data-part="read-write-head"
            data-name="Read/write head"
            data-rect="72 24 168 104 0"
            data-z="104"
            data-t="20"
            data-level="1"
            data-focal=""
          >
            <path
              data-role="silhouette"
              d="M268 404 L364 452 L364 472 L284 512 L188 464 L188 444 Z"
              fill="var(--paper-hi)"
            />
            <polygon points="364,452 284,492 284,512 364,472" fill="rgba(178,58,23,0.32)" />
            <polygon points="284,492 188,444 188,464 284,512" fill="rgba(178,58,23,0.20)" />
            <polygon points="268,404 364,452 284,492 188,444" fill="rgba(178,58,23,0.10)" />
            <polygon
              points="268,420 332,452 284,476 220,444"
              fill="var(--paper-hi)"
              stroke="rgba(28,25,21,0.55)"
              strokeWidth="0.8"
            />
            <polygon points="276,442 288,448 276,454 264,448" fill="var(--accent-dark)" />
            <path
              d="M268 404 L364 452 L364 472 L284 512 L188 464 L188 444 Z"
              fill="none"
              stroke="var(--accent-dark)"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <g data-role="label">
              <line
                data-role="leader"
                x1="370"
                y1="462"
                x2="568"
                y2="462"
                stroke="var(--accent-dark)"
                strokeWidth="0.8"
              />
              <circle cx="364" cy="462" r="2" fill="var(--accent-dark)" />
              <text className={styles.partName} data-role="name" x="580" y="458">
                Read/write head
              </text>
              <text
                x="580"
                y="478"
                fill="var(--accent-dark)"
                fontSize="10"
                fontFamily="'IBM Plex Mono', monospace"
                letterSpacing="0.08em"
              >
                read 1 / write 0
              </text>
            </g>
          </g>
          <g
            data-part="state-register"
            data-name="State register"
            data-rect="64 16 176 112 0"
            data-z="216"
            data-t="20"
            data-level="2"
          >
            <path
              data-role="silhouette"
              d="M268 284 L380 340 L380 360 L284 408 L172 352 L172 332 Z"
              fill="var(--paper-hi)"
            />
            <polygon points="380,340 284,388 284,408 380,360" fill="rgba(28,25,21,0.15)" />
            <polygon points="284,388 172,332 172,352 284,408" fill="rgba(28,25,21,0.07)" />
            <polygon points="268,284 380,340 284,388 172,332" fill="var(--paper-hi)" />
            <polygon
              points="268,308 332,340 284,364 220,332"
              fill="var(--ink)"
              stroke="rgba(28,25,21,0.55)"
              strokeWidth="0.8"
            />
            <g transform="matrix(1,0.5,-1,0.5,220,244)">
              <text
                x="120"
                y="73"
                fill="var(--paper-hi)"
                fontSize="18"
                fontFamily="'IBM Plex Mono', monospace"
                textAnchor="middle"
              >
                q0
              </text>
            </g>
            <path
              d="M268 284 L380 340 L380 360 L284 408 L172 352 L172 332 Z"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <g data-role="label">
              <line
                data-role="leader"
                x1="386"
                y1="350"
                x2="568"
                y2="350"
                stroke="rgba(28,25,21,0.40)"
                strokeWidth="0.8"
              />
              <circle cx="380" cy="350" r="2" fill="var(--ink)" />
              <text className={styles.partName} data-role="name" x="580" y="346">
                State register
              </text>
              <text
                x="580"
                y="366"
                fill="var(--ink-2)"
                fontSize="10"
                fontFamily="'IBM Plex Mono', monospace"
                letterSpacing="0.08em"
              >
                current state / q0
              </text>
            </g>
          </g>
          <g
            data-part="transition-table"
            data-name="Transition table"
            data-rect="0 0 240 128 0"
            data-z="328"
            data-t="24"
            data-level="3"
          >
            <path
              data-role="silhouette"
              d="M220 128 L460 248 L460 272 L332 336 L92 216 L92 192 Z"
              fill="var(--paper-hi)"
            />
            <polygon points="460,248 332,312 332,336 460,272" fill="rgba(28,25,21,0.15)" />
            <polygon points="332,312 92,192 92,216 332,336" fill="rgba(28,25,21,0.07)" />
            <polygon points="220,128 460,248 332,312 92,192" fill="var(--paper-hi)" />
            <polygon
              points="228,148 420,244 324,292 132,196"
              fill="var(--paper)"
              stroke="rgba(28,25,21,0.45)"
              strokeWidth="0.8"
            />
            <g transform="matrix(1,0.5,-1,0.5,220,128)">
              <line
                x1="32"
                y1="64"
                x2="208"
                y2="64"
                stroke="rgba(28,25,21,0.30)"
                strokeWidth="0.8"
              />
              <text
                x="76"
                y="48"
                fill="var(--ink-2)"
                fontSize="8"
                fontFamily="'IBM Plex Mono', monospace"
                textAnchor="middle"
                letterSpacing="0.08em"
              >
                WHEN
              </text>
              <text
                x="160"
                y="48"
                fill="var(--ink-2)"
                fontSize="8"
                fontFamily="'IBM Plex Mono', monospace"
                textAnchor="middle"
                letterSpacing="0.08em"
              >
                THEN
              </text>
              <text
                x="76"
                y="82"
                fill="var(--ink)"
                fontSize="10"
                fontFamily="'IBM Plex Mono', monospace"
                textAnchor="middle"
              >
                (q0, 1)
              </text>
              <text
                x="160"
                y="82"
                fill="var(--ink)"
                fontSize="10"
                fontFamily="'IBM Plex Mono', monospace"
                textAnchor="middle"
              >
                (q1, 0, R)
              </text>
            </g>
            <path
              d="M220 128 L460 248 L460 272 L332 336 L92 216 L92 192 Z"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <g data-role="label">
              <line
                data-role="leader"
                x1="466"
                y1="260"
                x2="568"
                y2="260"
                stroke="rgba(28,25,21,0.40)"
                strokeWidth="0.8"
              />
              <circle cx="460" cy="260" r="2" fill="var(--ink)" />
              <text className={styles.partName} data-role="name" x="580" y="256">
                Transition table
              </text>
              <text
                x="580"
                y="276"
                fill="var(--ink-2)"
                fontSize="10"
                fontFamily="'IBM Plex Mono', monospace"
                letterSpacing="0.04em"
              >
                (q0, 1) → (q1, 0, R)
              </text>
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}
