import { RefreshCw, Check } from "lucide-react"
import { Badge } from "./ui/badge"
import { Series } from "@/types"

type DataIndicatorProps = {
  dataNeedsReload: boolean
  loadingData: boolean
  series: Series[]
  reloadData: () => void
}

const DataIndicator = ({ dataNeedsReload, series, loadingData, reloadData }: DataIndicatorProps) => {
  if(series.length > 0 && dataNeedsReload && !loadingData) {
    reloadData()
  }

  if(series.length === 0) {
    return null
  }

  return <div className="flex flex-row justify-between items-center">
    {dataNeedsReload ? (
      <Badge className="bg-orange-500 hover:bg-orange-500"><RefreshCw size={14} className="mr-2 animate-spin" />Loading...</Badge>
    ) : (
      <Badge className="bg-green-500 hover:bg-green-500"><Check size={14} className="mr-2" />Data loaded</Badge>
    )}
  </div>
}

export default DataIndicator