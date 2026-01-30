declare module "echarts-for-react" {
  import type { Component, CSSProperties } from "react";

  export type ReactEChartsProps = {
    option: unknown;
    style?: CSSProperties;
    className?: string;
    notMerge?: boolean;
    lazyUpdate?: boolean;
    theme?: string | object;
    showLoading?: boolean;
    loadingOption?: unknown;
    opts?: unknown;
    onEvents?: Record<string, (params: unknown) => void>;
    onChartReady?: (chart: unknown) => void;
  };

  export default class ReactECharts extends Component<ReactEChartsProps> {}
}
