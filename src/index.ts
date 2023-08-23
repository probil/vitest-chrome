import { VitestChrome } from './vitest-chrome'
import { createHandler } from './createHandler'

export const chrome = new Proxy<VitestChrome>(
  {} as VitestChrome,
  createHandler(),
)
