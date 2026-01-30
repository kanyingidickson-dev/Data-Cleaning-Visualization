import ReactECharts from "echarts-for-react";

type Props = {
  title: string;
  xLabels: string[];
  yValues: number[];
  yLabel?: string;
};

export default function BarChart({ title, xLabels, yValues, yLabel }: Props) {
  const hasData = xLabels.length > 0 && yValues.length > 0;
  return (
    <div className="card">
      <div className="cardTitle">{title}</div>
      {hasData ? (
        <ReactECharts
          style={{ height: 320, width: "100%" }}
          option={{
            grid: { left: 12, right: 12, top: 32, bottom: 72, containLabel: true },
            tooltip: { trigger: "axis" },
            xAxis: {
              type: "category",
              data: xLabels,
              axisLabel: { rotate: 25, hideOverlap: true },
            },
            yAxis: { type: "value", name: yLabel },
            series: [
              {
                type: "bar",
                data: yValues,
                itemStyle: { color: "#0ea5e9" },
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
