import ReactECharts from "echarts-for-react";

type Point = [number, number];

type Props = {
  title: string;
  points: Point[];
  xLabel: string;
  yLabel: string;
};

export default function ScatterChart({ title, points, xLabel, yLabel }: Props) {
  const hasData = points.length > 0;
  return (
    <div className="card">
      <div className="cardTitle">{title}</div>
      {hasData ? (
        <ReactECharts
          style={{ height: 320, width: "100%" }}
          option={{
            grid: { left: 12, right: 12, top: 32, bottom: 52, containLabel: true },
            tooltip: { trigger: "item" },
            xAxis: { type: "value", name: xLabel },
            yAxis: { type: "value", name: yLabel },
            series: [
              {
                type: "scatter",
                data: points,
                symbolSize: 7,
                itemStyle: { color: "#4f46e5", opacity: 0.65 },
              },
            ],
          }}
        />
      ) : (
        <div className="emptyState">Run cleaning to generate this chart.</div>
      )}
      <div className="muted">Showing a sample for performance.</div>
    </div>
  );
}
