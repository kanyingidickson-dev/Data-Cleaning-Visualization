import ReactECharts from "echarts-for-react";

type Point = [number, number];

type Props = {
  title: string;
  points: Point[];
  xLabel: string;
  yLabel: string;
};

export default function ScatterChart({ title, points, xLabel, yLabel }: Props) {
  return (
    <div className="card">
      <div className="cardTitle">{title}</div>
      <ReactECharts
        style={{ height: 340 }}
        option={{
          grid: { left: 56, right: 18, top: 36, bottom: 52 },
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
      <div className="muted">Showing a sample for performance.</div>
    </div>
  );
}
