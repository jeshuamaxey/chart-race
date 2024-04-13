export const createChartTitle = (id: string, chartWidth: number, padding: number) => {
  const chartTitle = document.createElementNS("http://www.w3.org/2000/svg", "text")

  chartTitle.setAttribute("id", "chartTitle")
  chartTitle.setAttribute("x", (padding+64).toString())
  chartTitle.setAttribute("y", (padding+32).toString())
  chartTitle.setAttribute("text-anchor", "start")
  chartTitle.setAttribute("font-size", "24")
  chartTitle.setAttribute("font-weight", "bold")

  return chartTitle
}

export const createChartDate = (id: string, chartWidth: number, padding: number) => {
  const chartDateDisplay = document.createElementNS("http://www.w3.org/2000/svg", "text")

  chartDateDisplay.setAttribute("id", id)
  chartDateDisplay.setAttribute("x", (chartWidth - padding).toString())
  chartDateDisplay.setAttribute("y", (padding+32).toString())
  chartDateDisplay.setAttribute("text-anchor", "end")
  chartDateDisplay.setAttribute("font-size", "16")

  return chartDateDisplay
}

export const createChartAnnotation = (id: string, padding: number) => {
  const chartDateDisplay = document.createElementNS("http://www.w3.org/2000/svg", "text")

  chartDateDisplay.setAttribute("id", id)
  chartDateDisplay.setAttribute("x", (padding+64).toString())
  chartDateDisplay.setAttribute("y", (padding+64).toString())
  chartDateDisplay.setAttribute("text-anchor", "right")
  chartDateDisplay.setAttribute("font-size", "16")
  chartDateDisplay.setAttribute("font-weight", "bold")

  return chartDateDisplay
}