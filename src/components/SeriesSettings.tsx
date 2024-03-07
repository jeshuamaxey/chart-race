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

  return <div className="flex flex-row items-center gap-2">
    <div className="flex flex-row gap-2">
      <div>
        <Badge variant="outline" style={{background: series.config.color.hex}}>{series.symbol.symbol}</Badge>
      </div>
      <p>{series.name}</p>
    </div>
    <div className="flex flex-row flex-1 justify-end gap-2">
      <Badge variant="secondary">
        {series.data?.meta.exchangeName}
      </Badge>
      <Badge variant="secondary">
        {series.data?.meta.currency}
      </Badge>
      <Badge variant="secondary">
        {series.data?.meta.instrumentType}
      </Badge>
      <Select value={series.config.color.name} onValueChange={updateColor}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Color" />
        </SelectTrigger>
        <SelectContent>
          {colors.map(c =>  <SelectItem key={c.name} value={c.name}>
            <Badge variant="outline" style={{background: c.hex}}>{c.name}</Badge>
          </SelectItem> )}
        </SelectContent>
      </Select>

      <Button size="sm" variant="outline" onClick={(ev) => onRemoveSeries(series)}>
        <Trash size={14} />
      </Button>
    </div>
  </div>
}

export default SeriesSettings
