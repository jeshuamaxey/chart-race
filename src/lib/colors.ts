import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config'

const {theme} = resolveConfig(tailwindConfig)

const colors = [
  {name: "red", hex: theme.colors.red[500]},
  {name: "orange", hex: theme.colors.orange[500]},
  {name: "amber", hex: theme.colors.amber[500]},
  {name: "yellow", hex: theme.colors.yellow[500]},
  {name: "lime", hex: theme.colors.lime[500]},
  {name: "emerald", hex: theme.colors.emerald[500]},
  {name: "teal", hex: theme.colors.teal[500]},
  {name: "cyan", hex: theme.colors.cyan[500]},
  {name: "sky", hex: theme.colors.sky[500]},
  {name: "blue", hex: theme.colors.blue[500]},
  {name: "indigo", hex: theme.colors.indigo[500]},
  {name: "violet", hex: theme.colors.violet[500]},
  {name: "fuchsia", hex: theme.colors.fuchsia[500]},
  {name: "pink", hex: theme.colors.pink[500]},
  {name: "rose", hex: theme.colors.rose[500]},
]

export default colors