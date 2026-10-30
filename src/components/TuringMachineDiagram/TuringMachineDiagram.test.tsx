import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TuringMachineDiagram } from './TuringMachineDiagram'

describe('TuringMachineDiagram', () => {
  it('lets the page background show through', () => {
    const markup = renderToStaticMarkup(<TuringMachineDiagram />)

    expect(markup).not.toContain('<rect width="1000" height="720" fill="var(--paper)"')
    expect(markup).not.toContain('<pattern')
    expect(markup).toContain('viewBox="80 88 640 632"')
  })
})
