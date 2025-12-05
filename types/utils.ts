import type { ExportType } from './index'

export type RandomDelayFn = (options: { minInterval: number; maxInterval: number }) => Promise<void>

export type exportToExcelFnParams = {
  data: Ref<any[]>
  exportType: ExportType
}
