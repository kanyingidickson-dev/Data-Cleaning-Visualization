import ReactECharts from "echarts-for-react";

type Props = {
  title: string;
  xLabels: string[];
  yValues: number[];
};

export default function HistogramChart({ title, xLabels, yValues }: Props) {
  return (
    <div className="card">
      <div className="cardTitle">{title}</div>
      <ReactECharts
        style={{ height: 340 }}
        option={{
          grid: { left: 48, right: 18, top: 36, bottom: 42 },
          tooltip: { trigger: "axis" },
          xAxis: {
            type: "category",
            data: xLabels,
            axisLabel: { rotate: 45 },
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
    </div>
  );
}
