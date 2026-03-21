import type { DashboardMetric } from "../../types/dashboard";

type Props = {
  metrics: DashboardMetric[];
};

export default function DashboardMetrics({ metrics }: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {metrics.map((item) => (
        <div
          key={item.title}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">{item.title}</p>
          <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
            {item.value}
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {item.description}
          </p>
        </div>
      ))}
    </section>
  );
}