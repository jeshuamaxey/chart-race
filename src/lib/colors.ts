import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config'

const {theme} = resolveConfig(tailwindConfig)

const shade = 300

const colors = [
  {name: "red", hex: theme.colors.red[shade]},
  {name: "orange", hex: theme.colors.orange[shade]},
  {name: "amber", hex: theme.colors.amber[shade]},
  {name: "yellow", hex: theme.colors.yellow[shade]},
  {name: "lime", hex: theme.colors.lime[shade]},
  {name: "emerald", hex: theme.colors.emerald[shade]},
  {name: "teal", hex: theme.colors.teal[shade]},
  {name: "cyan", hex: theme.colors.cyan[shade]},
  {name: "sky", hex: theme.colors.sky[shade]},
  {name: "blue", hex: theme.colors.blue[shade]},
  {name: "indigo", hex: theme.colors.indigo[shade]},
  {name: "violet", hex: theme.colors.violet[shade]},
  {name: "fuchsia", hex: theme.colors.fuchsia[shade]},
  {name: "pink", hex: theme.colors.pink[shade]},
  {name: "rose", hex: theme.colors.rose[shade]},
]

export default colors