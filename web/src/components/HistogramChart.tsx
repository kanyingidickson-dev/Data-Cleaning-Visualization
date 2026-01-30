import ReactECharts from "echarts-for-react";

type Props = {
  title: string;
  xLabels: string[];
  yValues: number[];
};

export default function HistogramChart({ title, xLabels, yValues }: Props) {
  const hasData = xLabels.length > 0 && yValues.length > 0;
  return (
    <div className="card">
      <div className="cardTitle">{title}</div>
      {hasData ? (
        <ReactECharts
          style={{ height: 320, width: "100%" }}
          option={{
            grid: { left: 12, right: 12, top: 32, bottom: 64, containLabel: true },
            tooltip: { trigger: "axis" },
            xAxis: {
              type: "category",
              data: xLabels,
              axisLabel: { rotate: 35, hideOverlap: true },
            },
            yAxis: { type: "value" },
            series: [
              {
                type: "bar",
                data: yValues,
                itemStyle: { color: "#4f46e5" },
              },
            ],
          }}
        />
      ) : (
        <div className="emptyState">Run cleaning to generate this chart.</div>
      )}
    </div>
  );
}
