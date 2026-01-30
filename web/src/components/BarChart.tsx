import ReactECharts from "echarts-for-react";

type Props = {
  title: string;
  xLabels: string[];
  yValues: number[];
  yLabel?: string;
};

export default function BarChart({ title, xLabels, yValues, yLabel }: Props) {
  return (
    <div className="card">
      <div className="cardTitle">{title}</div>
      <ReactECharts
        style={{ height: 340 }}
        option={{
          grid: { left: 56, right: 18, top: 36, bottom: 86 },
          tooltip: { trigger: "axis" },
          xAxis: {
            type: "category",
            data: xLabels,
            axisLabel: { rotate: 35, interval: 0 },
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
    </div>
  );
}
