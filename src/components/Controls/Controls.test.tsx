import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { RunSettings } from './RunSettings'
import { StepControls } from './StepControls'

describe('Controls subcomponents', () => {
  it('renders step actions and run settings', () => {
    const actions = {
      reset: vi.fn<() => void>(),
      back: vi.fn<(n: number) => void>(),
      prev: vi.fn<() => void>(),
      togglePlay: vi.fn<() => void>(),
      next: vi.fn<() => void>(),
      forward: vi.fn<(n: number) => void>(),
      runToHalt: vi.fn<() => void>(),
    }
    const stepControls = renderToStaticMarkup(
      <StepControls actions={actions} machine={null} playing={false} stepN={10} />,
    )
    const runSettings = renderToStaticMarkup(
      <RunSettings
        stepN={10}
        speed={0}
        onStepNChange={vi.fn<(n: number) => void>()}
        onSpeedChange={vi.fn<(speed: number) => void>()}
      />,
    )

    expect(stepControls).toContain('aria-label="Step controls"')
    expect(stepControls).toContain('Run to halt')
    expect(runSettings).toContain('Speed')
    expect(runSettings).toContain('1/s')
  })
})
