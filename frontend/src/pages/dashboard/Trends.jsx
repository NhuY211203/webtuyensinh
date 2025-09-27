import { useMemo } from "react";
import { useData } from "../../context/DataContext.jsx";

export default function Trends() {
  const { programs } = useData();
  const topMajors = useMemo(() => {
    const map = new Map();
    programs.forEach(p => map.set(p.major, (map.get(p.major) || 0) + 1));
    return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6);
  }, [programs]);
  const maxVal = Math.max(...topMajors.map(m=>m[1]), 1);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Xu hướng ngành học</h1>
      <p className="text-gray-600 mb-6 text-sm">Top ngành xuất hiện nhiều trong dữ liệu (mẫu).</p>
      <div className="space-y-3">
        {topMajors.map(([name, count]) => (
          <div key={name}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{name}</span>
              <span className="text-gray-500">{count}</span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-primary-500" style={{width: `${(count/maxVal)*100}%`}} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
