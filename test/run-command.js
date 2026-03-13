import { Config } from '@oclif/core'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const getConfig = async () => {
  const root = resolve(__dirname, '..')
  const conf = new Config({ root })
  await conf.load()
  return conf
}

export const runCommand = async (Cmd, args = []) => {
  const conf = await getConfig()
  const instance = new Cmd(args, conf)
  return instance.run()
}
