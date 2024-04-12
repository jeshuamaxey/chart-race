import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


import { Series } from "@/types"
import { Button } from "./ui/button"
import { Trash } from "lucide-react"
import { Badge } from "./ui/badge"
import colors from "@/lib/colors"

type SeriesSettingsProps = {
  series: Series
  onRemoveSeries: (series: Series) => void
  onSeriesUpdate: (series: Series) => void
}

const SeriesSettings = ({ series, onRemoveSeries, onSeriesUpdate }: SeriesSettingsProps) => {

  const updateColor = (newColorName: string) => {
    const color = colors.find(c => c.name === newColorName)!
    onSeriesUpdate({...series, config: {...series.config, color}})
  }

  return <div className="flex flex-row gap-2 justify-around">
    <Select value={series.config.color.name} onValueChange={updateColor}>
      <SelectTrigger className="w-[100px]">
        <SelectValue placeholder="Color" />
      </SelectTrigger>
      <SelectContent>
        {colors.map(c =>  <SelectItem key={c.name} value={c.name}>
          <Badge variant="outline" style={{background: c.hex}}>{series.symbol.symbol}</Badge>
        </SelectItem> )}
      </SelectContent>
    </Select>

    <p className="flex-1 self-center">{series.name}</p>
    
    <Button size="sm" variant="ghost" onClick={(ev) => onRemoveSeries(series)}>
      <Trash size={14} />
    </Button>
  </div>
}

export default SeriesSettings
